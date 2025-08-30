import QuestEventToast from '@/components/ui/QuestEventToast'
import {
    useMutation,
    useQuery,
    useQueryClient,
    QueryClient,
} from '@tanstack/react-query'
import { chunk } from 'lodash'
import React, { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/api/api'
import { useAuth } from '@/hooks/useAuth'

import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    QuestMapping,
    Share,
} from '@/features/quests/types'
import { INatTaxon } from '@shared/types/iNatTypes'
import { Quest } from '../../server/models/quests'
import { QuestWithTaxa } from '../../types/types'

type ProgressData = {
    mappings: QuestMapping[]
    aggregatedProgress: AggregatedProgress[]
    detailedProgress: DetailedProgress[]
}
type GuestProgressData = {
    aggregatedProgress: AggregatedProgress[]
    detailedProgress: DetailedProgress[]
}

export const fetchQuests = async ({
    pageParam = 1,
    questId,
}: {
    pageParam?: number
    questId?: string | number
}): Promise<{ quests: Quest[]; nextPage: number | undefined }> => {
    const { data } = await api.get(
        `/quests/${questId}?page=${pageParam}&limit=10`
    )
    return {
        quests: data,
        nextPage: data.length === 10 ? pageParam + 1 : undefined,
    }
}

export const fetchQuest = async (
    questId?: string | number
): Promise<Quest | null> => {
    const { data } = await api.get(`/quests/${questId}`)
    console.log(data)
    return data
}

const fetchQuestByToken = async (token?: string) => {
    const { data } = await api.get(`/quest-sharing/shares/token/${token}`)
    console.log(data)
    return data
}

export const fetchTaxa = async (taxonIds: number[]) => {
    if (!taxonIds || taxonIds.length === 0) {
        return []
    }

    // Filter out invalid taxon IDs (null, undefined, empty strings, or non-positive numbers)
    const validTaxonIds = taxonIds.filter(
        (id) => id && typeof id === 'number' && id > 0
    )

    if (validTaxonIds.length === 0) {
        return []
    }

    const taxonIdChunks = chunk(validTaxonIds, 30)
    const taxaData = await Promise.all(
        taxonIdChunks.map(async (ids) => {
            const fields =
                'id,name,preferred_common_name,default_photo,iconic_taxon_name,rank,observations_count,wikipedia_url'
            const { data } = await api.get(
                `/iNatAPI/taxa/${ids.join(',')}?fields=${fields}`
            )
            return data.results || []
        })
    )
    return taxaData.flatMap((data) => data)
}

const fetchMappingsAndProgress = async (
    qid: string | number
): Promise<ProgressData> => {
    const [m, a, d] = await Promise.all([
        api.get(`/quest-sharing/quests/${qid}/mappings`),
        api.get(`/quest-sharing/quests/${qid}/progress/aggregate`),
        api.get(`/quest-sharing/quests/${qid}/progress/detailed`),
    ])
    return {
        mappings: m.data || [],
        aggregatedProgress: a.data || [],
        detailedProgress: d.data || [],
    }
}

const fetchGuestProgress = async (
    token: string
): Promise<GuestProgressData> => {
    const [p, a] = await Promise.all([
        api.get(`/quest-sharing/shares/token/${token}/progress`),
        api.get(`/quest-sharing/shares/token/${token}/progress/aggregate`),
    ])
    return { aggregatedProgress: a.data || [], detailedProgress: p.data || [] }
}

const fetchLeaderboard = async (questId: string | number) => {
    const { data } = await api.get(
        `/quest-sharing/quests/${questId}/progress/leaderboard`
    )
    console.log('Leaderboard: ', data)
    return data
}

const fetchLeaderboardByToken = async (token: string) => {
    const { data } = await api.get(
        `/quest-sharing/shares/token/${token}/progress/leaderboard`
    )
    return data
}

// Focused hook for owner quest access
export const useQuestOwner = ({
    questId,
    initialData,
}: {
    questId: string | number
    initialData?: { quest?: Quest | null; taxa?: INatTaxon[] }
}) => {
    const queryClient = useQueryClient()

    const questQuery = useQuery({
        queryKey: ['quest', questId],
        queryFn: () => fetchQuest(questId),
        initialData: initialData?.quest,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const quest = questQuery.data
    const isQuestSuccess = questQuery.isSuccess

    const taxaQuery = useQuery({
        queryKey: ['taxa', quest?.id],
        queryFn: () => fetchTaxa((quest as QuestWithTaxa)?.taxon_ids || []),
        initialData: initialData?.taxa,
        enabled:
            isQuestSuccess && !!(quest as QuestWithTaxa)?.taxon_ids?.length,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const progressQuery = useQuery({
        queryKey: ['progress', quest?.id],
        queryFn: () => fetchMappingsAndProgress(quest!.id),
        enabled: !!quest?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const leaderboardQuery = useQuery({
        queryKey: ['leaderboard', quest?.id],
        queryFn: () => fetchLeaderboard(quest!.id),
        enabled: !!quest?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const updateStatus = useMutation({
        mutationFn: (status: 'pending' | 'active' | 'paused' | 'ended') =>
            api.patch(`/quests/${quest!.id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quest', questId] })
        },
        onError: () => toast.error('Failed to update quest status'),
    })

    // EventSource for real-time updates
    useEffect(() => {
        if (!quest?.id) return

        const eventSource = new EventSource(`/api/quests/${quest.id}/events`)

        eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data)

            if (data.type === 'QUEST_STATUS_UPDATED') {
                toast.info(`Quest status updated to ${data.payload.status}`)
                queryClient.invalidateQueries({ queryKey: ['quest', questId] })
            } else if (
                ['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(data.type)
            ) {
                handleSpeciesEvent(data, quest.id, queryClient)
            }
        }

        return () => {
            eventSource.close()
        }
    }, [quest?.id, queryClient, questId])

    return {
        questData: quest,
        taxa: taxaQuery.data || [],
        mappings: progressQuery.data?.mappings as QuestMapping[] | undefined,
        aggregatedProgress: progressQuery.data?.aggregatedProgress,
        detailedProgress: progressQuery.data?.detailedProgress,
        leaderboard: leaderboardQuery.data,
        isLoading:
            questQuery.isLoading ||
            progressQuery.isLoading ||
            leaderboardQuery.isLoading,
        isTaxaLoading: questQuery.isLoading || taxaQuery.isLoading,
        isTaxaFetchingNextPage: taxaQuery.isFetching,
        taxaHasNextPage: false,
        fetchNextTaxaPage: () => {
            // Placeholder for future pagination - taxa are loaded in single request
        },
        isError:
            questQuery.isError ||
            progressQuery.isError ||
            leaderboardQuery.isError ||
            taxaQuery.isError,
        updateStatus: updateStatus.mutate,
    }
}

// Focused hook for guest quest access
export const useQuestGuest = ({ token }: { token: string }) => {
    const queryClient = useQueryClient()

    const sharedQuestQuery = useQuery({
        queryKey: ['sharedQuest', token],
        queryFn: () => fetchQuestByToken(token),
    })

    const quest = sharedQuestQuery.data?.quest
    const share = sharedQuestQuery.data?.share
    const isQuestSuccess = sharedQuestQuery.isSuccess

    const taxaQuery = useQuery({
        queryKey: ['taxa', quest?.id],
        queryFn: () => fetchTaxa((quest as QuestWithTaxa)?.taxon_ids || []),
        enabled:
            isQuestSuccess && !!(quest as QuestWithTaxa)?.taxon_ids?.length,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const guestProgressQuery = useQuery({
        queryKey: ['guestProgress', token],
        queryFn: () => fetchGuestProgress(token),
        enabled: !!token,
    })

    const guestLeaderboardQuery = useQuery({
        queryKey: ['leaderboard', token],
        queryFn: () => fetchLeaderboardByToken(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    })

    // EventSource for real-time updates
    useEffect(() => {
        if (!quest?.id) return

        const eventSource = new EventSource(`/api/quests/${quest.id}/events`)

        eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data)

            if (data.type === 'QUEST_STATUS_UPDATED') {
                toast.info(`Quest status updated to ${data.payload.status}`)
                queryClient.invalidateQueries({
                    queryKey: ['sharedQuest', token],
                })
            } else if (
                ['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(data.type)
            ) {
                handleSpeciesEvent(data, quest.id, queryClient, token)
            }
        }

        return () => {
            eventSource.close()
        }
    }, [quest?.id, queryClient, token])

    return {
        questData: quest,
        taxa: taxaQuery.data || [],
        mappings: sharedQuestQuery.data?.taxa_mappings || [],
        aggregatedProgress: guestProgressQuery.data?.aggregatedProgress,
        detailedProgress: guestProgressQuery.data?.detailedProgress,
        leaderboard: guestLeaderboardQuery.data,
        share: share,
        isLoading:
            sharedQuestQuery.isLoading ||
            guestProgressQuery.isLoading ||
            guestLeaderboardQuery.isLoading,
        isTaxaLoading: sharedQuestQuery.isLoading || taxaQuery.isLoading,
        isTaxaFetchingNextPage: taxaQuery.isFetching,
        taxaHasNextPage: false,
        fetchNextTaxaPage: () => {
            // Placeholder for future pagination - taxa are loaded in single request
        },
        isError:
            sharedQuestQuery.isError ||
            guestProgressQuery.isError ||
            guestLeaderboardQuery.isError ||
            taxaQuery.isError,
        updateStatus: undefined, // Guests cannot update quest status
    }
}

// Helper function for handling species events
const handleSpeciesEvent = (
    data: {
        type: string
        payload: {
            guestName?: string
            owner?: boolean
            mappingId: number
        }
    },
    questId: number,
    queryClient: QueryClient,
    token?: string
) => {
    const progressData: ProgressData | undefined = queryClient.getQueryData([
        'progress',
        questId,
    ])
    const sharedQuestData: { taxa_mappings: QuestMapping[] } | undefined =
        queryClient.getQueryData(['sharedQuest', token])
    const taxaData: INatTaxon[] | undefined = queryClient.getQueryData([
        'taxa',
        questId,
    ])

    const guestName =
        data.payload.guestName || (data.payload.owner ? 'The owner' : 'A guest')
    const mappings =
        progressData?.mappings ||
        (sharedQuestData?.taxa_mappings as QuestMapping[])

    if (!mappings) return

    const mapping = mappings.find(
        (m: QuestMapping) => m.id === data.payload.mappingId
    )
    if (!mapping) return

    const species = taxaData?.find((t: INatTaxon) => t.id === mapping.taxon_id)
    const speciesName = species?.preferred_common_name
        ? species.preferred_common_name
        : species?.name || 'a species'
    const action = data.type === 'SPECIES_FOUND' ? 'found' : 'unmarked'

    toast(
        React.createElement(QuestEventToast, {
            guestName,
            speciesName,
            action,
            speciesImage: species?.default_photo?.square_url,
        }),
        {
            position: 'top-left',
            style: {
                padding: 0,
                margin: 0,
                width: '90svw',
                borderWidth: 0,
                boxShadow: 'none',
                background: 'none',
                outline: 'none',
            },
        }
    )

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['progress', questId] })
    queryClient.invalidateQueries({ queryKey: ['guestProgress', token] })
    queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] })

    if (token) {
        queryClient.invalidateQueries({ queryKey: ['leaderboard', token] })
    } else {
        queryClient.invalidateQueries({ queryKey: ['leaderboard', questId] })
    }
}

// Common interface for quest data
interface QuestDataResult {
    questData: Quest | null
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    leaderboard?: LeaderboardEntry[]
    share?: Share
    isLoading: boolean
    isTaxaLoading: boolean
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    isError: boolean
    updateStatus?: (status: 'pending' | 'active' | 'paused' | 'ended') => void
    fetchNextTaxaPage: () => void
}

// Hook that composes owner/guest hooks and handles common display logic
export const useQuestDisplay = ({
    questId,
    token,
    initialData,
}: {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
}): QuestDataResult & { isOwner: boolean; canEdit: boolean } => {
    const { isAuthenticated, user } = useAuth()
    const questData: QuestDataResult = questId
        ? useQuestOwner({ questId, initialData })
        : useQuestGuest({ token: token! })

    // Common display logic can be added here
    const isOwner =
        !!questId &&
        isAuthenticated &&
        questData.questData?.user_id === user?.id // Owner access when questId is provided AND user is authenticated AND owns the quest
    const canEdit = isOwner && questData.questData?.status !== 'ended'

    return {
        ...questData,
        isOwner,
        canEdit,
    }
}

// Hook for species progress management
export const useSpeciesProgress = ({
    mappings,
    detailedProgress,
    aggregatedProgress,
    taxa,
}: {
    mappings?: QuestMapping[]
    detailedProgress?: DetailedProgress[]
    aggregatedProgress?: AggregatedProgress[]
    taxa?: INatTaxon[]
}) => {
    const queryClient = useQueryClient()

    const handleProgressUpdate = useCallback(
        async (
            mapping: QuestMapping,
            isOwner: boolean,
            user?: { id: number; name?: string; username?: string },
            share?: Share,
            questData?: Quest,
            token?: string
        ) => {
            if (!mapping) return

            try {
                const userDisplayName = isOwner
                    ? user?.username
                    : share?.guest_name
                const progress = detailedProgress?.find(
                    (p) =>
                        p.display_name === userDisplayName &&
                        p.mapping_id === mapping.id
                )

                const observed = !progress
                const endpoint =
                    isOwner && questData
                        ? `/quest-sharing/quests/${questData.id}/progress/${mapping.id}`
                        : `/quest-sharing/shares/token/${token}/progress/${mapping.id}`

                await api.post(endpoint, { observed })
                console.log('Progress updated')

                // Invalidate relevant queries
                queryClient.invalidateQueries({
                    queryKey: ['progress', questData?.id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['guestProgress', token],
                })
            } catch (_error) {
                toast.error('Action failed')
            }
        },
        [detailedProgress, queryClient]
    )

    const getAvatarOverlay = useCallback(
        (recentEntries: DetailedProgress[], questMode: string) => {
            if (recentEntries.length > 0) {
                if (questMode === 'competitive') {
                    // For competitive mode, show only the most recent finder
                    const mostRecentEntry = recentEntries.sort(
                        (a, b) =>
                            new Date(b.observed_at).getTime() -
                            new Date(a.observed_at).getTime()
                    )[0]
                    return { displayName: mostRecentEntry.display_name }
                } else if (questMode === 'cooperative') {
                    // For cooperative mode, show all users who found it
                    const uniqueDisplayNames = [
                        ...new Set(
                            recentEntries.map((entry) => entry.display_name)
                        ),
                    ]

                    // Find the first finder (earliest observation)
                    const firstFinderEntry = recentEntries.sort(
                        (a, b) =>
                            new Date(a.observed_at).getTime() -
                            new Date(b.observed_at).getTime()
                    )[0]

                    return {
                        displayNames: uniqueDisplayNames,
                        firstFinder: firstFinderEntry.display_name,
                    }
                }
            }
            return null
        },
        []
    )

    return {
        handleProgressUpdate,
        getAvatarOverlay,
    }
}

// Hook for species actions and UI state
export const useSpeciesActions = ({
    isOwner,
    token,
    questData,
    user,
    share,
}: {
    isOwner: boolean
    token?: string
    questData?: Quest
    user?: { id: number; name?: string; username?: string }
    share?: Share
}) => {
    const canInteract = useCallback(
        (questStatus?: string) => {
            return (isOwner || token) && questStatus === 'active'
        },
        [isOwner, token]
    )

    const getUserDisplayInfo = useCallback(() => {
        return {
            isOwner,
            userDisplayName: isOwner ? user?.username : share?.guest_name,
            canEdit: isOwner && questData?.status !== 'ended',
        }
    }, [isOwner, user?.username, share?.guest_name, questData?.status])

    return {
        canInteract,
        getUserDisplayInfo,
    }
}

// Legacy hook for backward compatibility - delegates to focused hooks
export const useQuest = ({
    questId,
    token,
    initialData,
}: {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
}) => {
    if (questId) {
        return useQuestOwner({ questId, initialData })
    } else if (token) {
        return useQuestGuest({ token })
    } else {
        throw new Error('Either questId or token must be provided')
    }
}
