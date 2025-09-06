import {
    useQuery,
    useQueryClient,
    QueryClient,
    QueryKey,
} from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/api/api'
import { INatTaxon } from '@shared/types'
import { QuestWithTaxa } from '../../types/types'

interface QuestWithPhoto extends QuestWithTaxa {
    photoUrl?: string | null
}

async function fetchAndAssignPhotos(
    quests: QuestWithTaxa[],
    queryClient: QueryClient,
    queryKey: QueryKey,
    setIsPhotosLoading: (isLoading: boolean) => void
) {
    setIsPhotosLoading(true)
    const batchSize = 3
    for (let i = 0; i < quests.length; i += batchSize) {
        const batch = quests.slice(i, i + batchSize)
        const batchPromises = batch.map(async (quest) => {
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
                                return {
                                    ...quest,
                                    photoUrl: taxa[0].default_photo.medium_url,
                                }
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
                }
            }
            return { ...quest, photoUrl: null }
        })

        const batchResults = await Promise.all(batchPromises)

        queryClient.setQueryData(
            queryKey,
            (oldData: QuestWithTaxa[] | undefined) => {
                if (!oldData) return []
                return oldData.map((quest) => {
                    const updatedQuest = batchResults.find(
                        (q) => q.id === quest.id
                    )
                    return updatedQuest || quest
                })
            }
        )

        if (i + batchSize < quests.length) {
            await new Promise((resolve) => setTimeout(resolve, 500))
        }
    }
    setIsPhotosLoading(false)
}

export function useQuestsWithPhotos(questsEnabled = true) {
    const queryClient = useQueryClient()
    const queryKey = ['publicQuests']
    const [isPhotosLoading, setIsPhotosLoading] = useState(false)

    const questsQuery = useQuery<QuestWithPhoto[]>({
        queryKey,
        queryFn: async () => {
            const response = await api.get('/quests')
            return response.data.map((quest: QuestWithTaxa) => ({
                ...quest,
                photoUrl: undefined,
            }))
        },
        enabled: questsEnabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })

    useEffect(() => {
        if (questsQuery.data) {
            fetchAndAssignPhotos(
                questsQuery.data,
                queryClient,
                queryKey,
                setIsPhotosLoading
            )
        }
    }, [questsQuery.data, queryClient])

    return {
        data: questsQuery.data || [],
        isLoading: questsQuery.isLoading,
        isError: questsQuery.isError,
        error: questsQuery.error,
        isPhotosLoading,
    }
}

export function useUserQuestsWithPhotos(userId: number | undefined) {
    const queryClient = useQueryClient()
    const queryKey = ['userQuests', userId]
    const [isPhotosLoading, setIsPhotosLoading] = useState(false)

    const questsQuery = useQuery<QuestWithPhoto[]>({
        queryKey,
        queryFn: async () => {
            const response = await api.get(`/quests/user/${userId}`)
            return response.data.map((quest: QuestWithTaxa) => ({
                ...quest,
                photoUrl: undefined,
            }))
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })

    useEffect(() => {
        if (questsQuery.data) {
            fetchAndAssignPhotos(
                questsQuery.data,
                queryClient,
                queryKey,
                setIsPhotosLoading
            )
        }
    }, [questsQuery.data, queryClient, userId])

    return {
        data: questsQuery.data || [],
        isLoading: questsQuery.isLoading,
        isError: questsQuery.isError,
        error: questsQuery.error,
        isPhotosLoading,
    }
}
