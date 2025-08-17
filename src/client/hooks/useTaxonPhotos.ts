import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/api'
import { INatTaxon } from '../../shared/types/iNatTypes'

/**
 * Hook to fetch photo for a single taxon
 */
export function useTaxonPhoto(taxonId: number | undefined) {
    return useQuery({
        queryKey: ['taxonPhoto', taxonId],
        queryFn: async (): Promise<string | null> => {
            if (!taxonId) return null

            const response = await api.get(`/iNatAPI/taxa/${taxonId}`)
            const taxa: INatTaxon[] = response.data.results || []

            return taxa[0]?.default_photo?.medium_url || null
        },
        enabled: !!taxonId,
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
        retry: (failureCount, error: any) => {
            // Retry up to 2 times, but not for rate limit errors
            if (error?.response?.status === 429) return false
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}

/**
 * Hook to fetch photos for multiple taxa
 */
export function useTaxonPhotos(taxonIds: number[]) {
    return useQueries({
        queries: taxonIds.map((taxonId) => ({
            queryKey: ['taxonPhoto', taxonId],
            queryFn: async (): Promise<string | null> => {
                const response = await api.get(`/iNatAPI/taxa/${taxonId}`)
                const taxa: INatTaxon[] = response.data.results || []

                return taxa[0]?.default_photo?.medium_url || null
            },
            staleTime: 30 * 60 * 1000, // 30 minutes
            cacheTime: 60 * 60 * 1000, // 1 hour
            retry: (failureCount, error: any) => {
                if (error?.response?.status === 429) return false
                return failureCount < 2
            },
            retryDelay: (attemptIndex) =>
                Math.min(1000 * 2 ** attemptIndex, 30000),
        })),
    })
}

/**
 * Hook to get the first available photo from a list of taxon IDs
 */
export function useQuestPhoto(taxonIds: number[] = []) {
    // Take first 3 taxon IDs for efficiency
    const selectedIds = taxonIds.slice(0, 3)

    const photoQueries = useTaxonPhotos(selectedIds)

    // Find the first successful photo
    const photoUrl = photoQueries.find((query) => query.data)?.data || null

    // Determine loading state - we're loading if any query is loading and we don't have a photo yet
    const isLoading = !photoUrl && photoQueries.some((query) => query.isLoading)

    // Determine error state - error if all queries have errored
    const isError =
        selectedIds.length > 0 && photoQueries.every((query) => query.isError)

    return {
        data: photoUrl,
        isLoading,
        isError,
        queries: photoQueries,
    }
}

/**
 * Hook to fetch photos for multiple quests
 */
export function useQuestPhotos(
    quests: Array<{ id: number; taxon_ids?: number[] }>
) {
    const questPhotoQueries = useQueries({
        queries: quests.map((quest) => {
            const taxonIds = quest.taxon_ids?.slice(0, 3) || []
            const firstTaxonId = taxonIds[0]

            return {
                queryKey: ['questPhoto', quest.id, firstTaxonId],
                queryFn: async (): Promise<string | null> => {
                    if (taxonIds.length === 0) return null

                    // Try each taxon until we find one with a photo
                    for (const taxonId of taxonIds) {
                        try {
                            const response = await api.get(
                                `/iNatAPI/taxa/${taxonId}`
                            )
                            const taxa: INatTaxon[] =
                                response.data.results || []
                            const photoUrl = taxa[0]?.default_photo?.medium_url

                            if (photoUrl) return photoUrl
                        } catch (error) {
                            console.warn(
                                `Failed to fetch taxon ${taxonId}:`,
                                error
                            )
                            continue
                        }
                    }

                    return null
                },
                enabled: taxonIds.length > 0,
                staleTime: 30 * 60 * 1000, // 30 minutes
                cacheTime: 60 * 60 * 1000, // 1 hour
                retry: (failureCount, error: any) => {
                    if (error?.response?.status === 429) return false
                    return failureCount < 2
                },
                retryDelay: (attemptIndex) =>
                    Math.min(1000 * 2 ** attemptIndex, 30000),
            }
        }),
    })

    // Create a map of quest ID to photo URL
    const photoMap = new Map<number, string | null>()
    quests.forEach((quest, index) => {
        const query = questPhotoQueries[index]
        if (query?.data !== undefined) {
            photoMap.set(quest.id, query.data)
        }
    })

    // Determine overall loading state
    const isLoading = questPhotoQueries.some((query) => query.isLoading)

    return {
        photoMap,
        isLoading,
        queries: questPhotoQueries,
    }
}

/**
 * Utility hook to prefetch taxon photo
 */
export function usePrefetchTaxonPhoto() {
    const queryClient = useQueryClient()

    return (taxonId: number) => {
        queryClient.prefetchQuery({
            queryKey: ['taxonPhoto', taxonId],
            queryFn: async (): Promise<string | null> => {
                const response = await api.get(`/iNatAPI/taxa/${taxonId}`)
                const taxa: INatTaxon[] = response.data.results || []

                return taxa[0]?.default_photo?.medium_url || null
            },
            staleTime: 30 * 60 * 1000,
        })
    }
}
