import {
    keepPreviousData,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { INatTaxon } from '@shared/types/iNaturalist'
import { useCallback, useMemo } from 'react'
import { QuestWithTaxa } from '../types/questTypes'

const BATCH_SIZE = 150 // Reduced from 200 to 150 to be more conservative with rate limits

/**
 * Fetches taxa in batches to avoid too many requests.
 */
const fetchTaxaInBatches = async (taxonIds: number[]) => {
    const uniqueTaxonIds = [...new Set(taxonIds)]
    const batches: number[][] = []

    for (let i = 0; i < uniqueTaxonIds.length; i += BATCH_SIZE) {
        batches.push(uniqueTaxonIds.slice(i, i + BATCH_SIZE))
    }

    const batchPromises = batches.map(async (batch) => {
        try {
            const response = await axiosInstance.get(`/iNatAPI/taxa/${batch.join(',')}`)
            return response.data.results as INatTaxon[]
        } catch (error: unknown) {
            // For errors, return empty array to not break everything
            // Backend handles rate limiting and retries
            console.warn(`Error fetching batch: ${batch.join(',')}`, error)
            return []
        }
    })

    const results = await Promise.all(batchPromises)
    return results.flat()
}

/**
 * Hook to fetch photos for multiple taxa.
 * This hook will now batch requests to the iNaturalist API.
 */
export function useTaxonPhotos(taxonIds: number[]) {
    return useQuery<(string | null)[]>({
        queryKey: ['taxonPhotos', taxonIds],
        queryFn: async () => {
            if (taxonIds.length === 0) return []

            const taxa = await fetchTaxaInBatches(taxonIds)
            const taxaById = new Map(taxa.map((t) => [t.id, t]))

            return taxonIds.map(
                (id) => taxaById.get(id)?.default_photo?.medium_url || null
            )
        },
        enabled: taxonIds.length > 0,
        staleTime: 24 * 60 * 60 * 1000, // Increased from 30min to 24h for taxa data
        gcTime: 48 * 60 * 60 * 1000, // Increased from 1h to 48h
        placeholderData: keepPreviousData,
        refetchOnMount: false, // Don't refetch on mount if data is cached
    })
}

/**
 * Hook to fetch photo for a single taxon.
 * Leverages the batched query for efficiency.
 */
export function useTaxonPhoto(taxonId: number | undefined) {
    const { data: photos, isLoading } = useTaxonPhotos(taxonId ? [taxonId] : [])
    return {
        data: photos?.[0] || null,
        isLoading,
    }
}

/**
 * Hook to get the first available photo from a list of taxon IDs
 */
export function useQuestPhoto(taxonIds: number[] = []) {
    const selectedIds = taxonIds.slice(0, 5) // Up to 5 to increase chance of having a photo
    const { data: photos, isLoading, isError } = useTaxonPhotos(selectedIds)

    const photoUrl = photos?.find((photo) => photo) || null

    return {
        data: photoUrl,
        isLoading,
        isError,
    }
}

/**
 * Hook to fetch photos for multiple quests
 */
export function useQuestPhotos(
    quests: Array<{ id: number; taxon_ids?: number[] }>
) {
    const allTaxonIds = quests.flatMap(
        (quest) => quest.taxon_ids?.slice(0, 1) || []
    )
    const { data: photos, isLoading } = useTaxonPhotos(allTaxonIds)

    const photoMap = new Map<number, string | null>()
    let photoIndex = 0
    quests.forEach((quest) => {
        if (quest.taxon_ids && quest.taxon_ids.length > 0) {
            photoMap.set(quest.id, photos?.[photoIndex] || null)
            photoIndex++
        } else {
            photoMap.set(quest.id, null)
        }
    })

    return {
        photoMap,
        isLoading,
    }
}

/**
 * Hook to fetch collage photos for multiple quests.
 * It fetches up to `photosPerQuest` photos for each quest.
 */
export function useQuestPhotoCollage(
    quests: QuestWithTaxa[],
    options: { photosPerQuest?: number } = {}
) {
    const { photosPerQuest = 6 } = options

    const allTaxonIdsForCollage = useMemo(
        () =>
            quests
                .flatMap(
                    (quest) => quest.taxon_ids?.slice(0, photosPerQuest) || []
                )
                .sort((a, b) => a - b), // Sort to ensure consistent cache key
        [quests, photosPerQuest]
    )

    const { data: collagePhotosData, isLoading } = useTaxonPhotos(
        allTaxonIdsForCollage
    )

    const questToPhotosMap = useMemo(() => {
        const newMap = new Map<number, string[]>()
        if (collagePhotosData && allTaxonIdsForCollage.length > 0) {
            // Create a map from taxon ID to photo URL
            const taxonIdToPhoto = new Map<number, string | null>()
            allTaxonIdsForCollage.forEach((taxonId, index) => {
                taxonIdToPhoto.set(taxonId, collagePhotosData[index] || null)
            })

            // For each quest, collect photos for its taxon IDs
            for (const quest of quests) {
                const questPhotos: string[] = []
                const questTaxonIds =
                    quest.taxon_ids?.slice(0, photosPerQuest) || []

                for (const taxonId of questTaxonIds) {
                    const photo = taxonIdToPhoto.get(taxonId)
                    if (photo) {
                        questPhotos.push(photo)
                    }
                }

                newMap.set(quest.id, questPhotos)
            }
        }
        return newMap
    }, [quests, collagePhotosData, allTaxonIdsForCollage, photosPerQuest])

    return {
        questToPhotosMap,
        isLoading,
    }
}

/**
 * Hook for quest photos with debouncing to prevent API rate limits
 * Loads photos for all quests but with debouncing to avoid overwhelming the API
 */
export function useLazyQuestPhotoCollage(
    quests: QuestWithTaxa[],
    options: { photosPerQuest?: number } = {}
) {
    const { photosPerQuest = 6 } = options

    // Load photos for all quests
    const { questToPhotosMap, isLoading } = useQuestPhotoCollage(quests, {
        photosPerQuest,
    })

    // Simple observe function (no-op since we load all quests)
    const observeQuest = useCallback(
        (_questId: number, _element: HTMLElement | null) => {
            // No-op - we load all quests
        },
        []
    )

    return {
        questToPhotosMap,
        isLoading,
        observeQuest,
    }
}

/**
 * Utility hook to prefetch taxon photo
 */
export function usePrefetchTaxonPhoto() {
    const queryClient = useQueryClient()

    return async (taxonId: number): Promise<void> => {
        await queryClient.prefetchQuery<(string | null)[]>({
            queryKey: ['taxonPhotos', [taxonId]],
            queryFn: async () => {
                const taxa = await fetchTaxaInBatches([taxonId])
                return [taxa[0]?.default_photo?.medium_url || null]
            },
            staleTime: 24 * 60 * 60 * 1000, // Increased from 30min to 24h
        })
    }
}
