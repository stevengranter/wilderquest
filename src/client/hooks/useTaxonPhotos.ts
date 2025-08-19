import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/api'
import { INatTaxon } from '@shared/types/iNatTypes'

const BATCH_SIZE = 30

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
        const response = await api.get(`/iNatAPI/taxa/${batch.join(',')}`)
        return response.data.results as INatTaxon[]
    })

    const results = await Promise.all(batchPromises)
    return results.flat()
}

/**
 * Hook to fetch photos for multiple taxa.
 * This hook will now batch requests to the iNaturalist API.
 */
export function useTaxonPhotos(taxonIds: number[]) {
    return useQuery({
        queryKey: ['taxonPhotos', taxonIds],
        queryFn: async () => {
            if (taxonIds.length === 0) return []

            const taxa = await fetchTaxaInBatches(taxonIds)
            const taxaById = new Map(taxa.map((t) => [t.id, t]))

            return taxonIds.map(
                (id) =>
                    taxaById.get(id)?.default_photo?.medium_url || null
            )
        },
        enabled: taxonIds.length > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
    })
}

/**
 * Hook to fetch photo for a single taxon.
 * Leverages the batched query for efficiency.
 */
export function useTaxonPhoto(taxonId: number | undefined) {
    const { data: photos } = useTaxonPhotos(taxonId ? [taxonId] : [])
    return {
        data: photos?.[0] || null,
        isLoading: !photos,
    }
}

/**
 * Hook to get the first available photo from a list of taxon IDs
 */
export function useQuestPhoto(taxonIds: number[] = []) {
    const selectedIds = taxonIds.slice(0, 5) // Increased to 5 to have more chances for a photo
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
 * Utility hook to prefetch taxon photo
 */
export function usePrefetchTaxonPhoto() {
    const queryClient = useQueryClient()

    return (taxonId: number) => {
        queryClient.prefetchQuery({
            queryKey: ['taxonPhotos', [taxonId]],
            queryFn: async () => {
                const taxa = await fetchTaxaInBatches([taxonId])
                return [taxa[0]?.default_photo?.medium_url || null]
            },
            staleTime: 30 * 60 * 1000,
        })
    }
}
