import { useQuery } from '@tanstack/react-query'
import api from '@/api/api'
import { INatTaxon } from '../../shared/types/iNatTypes'
import { QuestWithTaxa } from '../../types/types'

interface QuestWithPhoto extends QuestWithTaxa {
    photoUrl?: string | null
}

/**
 * Hook to fetch quests with their photos efficiently using React Query
 */
export function useQuestsWithPhotos(questsEnabled = true) {
    // First, fetch the quests
    const questsQuery = useQuery({
        queryKey: ['publicQuests'],
        queryFn: async (): Promise<QuestWithTaxa[]> => {
            const response = await api.get('/quests')
            return response.data
        },
        enabled: questsEnabled,
        staleTime: 5 * 60 * 1000, // 5 minutes for quest data
        cacheTime: 30 * 60 * 1000, // 30 minutes
    })

    // Then fetch photos for each quest
    const questsWithPhotosQuery = useQuery({
        queryKey: ['questsWithPhotos', questsQuery.data?.map((q) => q.id)],
        queryFn: async (): Promise<QuestWithPhoto[]> => {
            const quests = questsQuery.data || []
            const questsWithPhotos: QuestWithPhoto[] = []

            // Process quests in small batches to respect rate limits
            const batchSize = 3
            for (let i = 0; i < quests.length; i += batchSize) {
                const batch = quests.slice(i, i + batchSize)

                const batchPromises = batch.map(async (quest) => {
                    const questWithPhoto: QuestWithPhoto = { ...quest }

                    if (quest.taxon_ids && quest.taxon_ids.length > 0) {
                        try {
                            // Try first 3 taxon IDs to find a photo
                            const selectedIds = quest.taxon_ids.slice(0, 3)

                            for (const taxonId of selectedIds) {
                                try {
                                    const response = await api.get(
                                        `/iNatAPI/taxa/${taxonId}`
                                    )
                                    const taxa: INatTaxon[] =
                                        response.data.results || []

                                    if (taxa[0]?.default_photo?.medium_url) {
                                        questWithPhoto.photoUrl =
                                            taxa[0].default_photo.medium_url
                                        break // Use first photo found
                                    }
                                } catch (error) {
                                    console.warn(
                                        `Failed to fetch taxon ${taxonId}:`,
                                        error
                                    )
                                    // Continue to next taxon
                                }
                            }
                        } catch (error) {
                            console.warn(
                                `Failed to fetch photo for quest ${quest.id}:`,
                                error
                            )
                            questWithPhoto.photoUrl = null
                        }
                    } else {
                        questWithPhoto.photoUrl = null
                    }

                    return questWithPhoto
                })

                const batchResults = await Promise.all(batchPromises)
                questsWithPhotos.push(...batchResults)

                // Add delay between batches to respect rate limits
                if (i + batchSize < quests.length) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }
            }

            return questsWithPhotos
        },
        enabled: !!questsQuery.data && questsQuery.data.length > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 429) return false
            return failureCount < 1
        },
        retryDelay: 2000,
    })

    return {
        data: questsWithPhotosQuery.data || [],
        isLoading: questsQuery.isLoading || questsWithPhotosQuery.isLoading,
        isError: questsQuery.isError || questsWithPhotosQuery.isError,
        error: questsQuery.error || questsWithPhotosQuery.error,
        questsOnly: questsQuery.data || [],
        photosLoading: questsWithPhotosQuery.isLoading,
    }
}

/**
 * Hook to fetch user quests with photos
 */
export function useUserQuestsWithPhotos(userId: number | undefined) {
    // First, fetch the user's quests
    const questsQuery = useQuery({
        queryKey: ['userQuests', userId],
        queryFn: async (): Promise<QuestWithTaxa[]> => {
            const response = await api.get(`/quests/user/${userId}`)
            return response.data
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    })

    // Then fetch photos for each quest
    const questsWithPhotosQuery = useQuery({
        queryKey: [
            'userQuestsWithPhotos',
            userId,
            questsQuery.data?.map((q) => q.id),
        ],
        queryFn: async (): Promise<QuestWithPhoto[]> => {
            const quests = questsQuery.data || []
            const questsWithPhotos: QuestWithPhoto[] = []

            // Process quests in small batches
            const batchSize = 3
            for (let i = 0; i < quests.length; i += batchSize) {
                const batch = quests.slice(i, i + batchSize)

                const batchPromises = batch.map(async (quest) => {
                    const questWithPhoto: QuestWithPhoto = { ...quest }

                    if (quest.taxon_ids && quest.taxon_ids.length > 0) {
                        try {
                            const selectedIds = quest.taxon_ids.slice(0, 3)

                            for (const taxonId of selectedIds) {
                                try {
                                    const response = await api.get(
                                        `/iNatAPI/taxa/${taxonId}`
                                    )
                                    const taxa: INatTaxon[] =
                                        response.data.results || []

                                    if (taxa[0]?.default_photo?.medium_url) {
                                        questWithPhoto.photoUrl =
                                            taxa[0].default_photo.medium_url
                                        break
                                    }
                                } catch (error) {
                                    console.warn(
                                        `Failed to fetch taxon ${taxonId}:`,
                                        error
                                    )
                                }
                            }
                        } catch (error) {
                            console.warn(
                                `Failed to fetch photo for quest ${quest.id}:`,
                                error
                            )
                            questWithPhoto.photoUrl = null
                        }
                    } else {
                        questWithPhoto.photoUrl = null
                    }

                    return questWithPhoto
                })

                const batchResults = await Promise.all(batchPromises)
                questsWithPhotos.push(...batchResults)

                // Add delay between batches
                if (i + batchSize < quests.length) {
                    await new Promise((resolve) => setTimeout(resolve, 500))
                }
            }

            return questsWithPhotos
        },
        enabled: !!questsQuery.data && questsQuery.data.length > 0,
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 429) return false
            return failureCount < 1
        },
        retryDelay: 2000,
    })

    return {
        data: questsWithPhotosQuery.data || [],
        isLoading: questsQuery.isLoading || questsWithPhotosQuery.isLoading,
        isError: questsQuery.isError || questsWithPhotosQuery.isError,
        error: questsQuery.error || questsWithPhotosQuery.error,
        questsOnly: questsQuery.data || [],
        photosLoading: questsWithPhotosQuery.isLoading,
    }
}
