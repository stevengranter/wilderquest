import { QuestEventToast } from '@/features/quests/components'
import {
    QueryClient,
    useMutation,
    useQuery,
    useInfiniteQuery,
    useQueryClient,
} from '@tanstack/react-query'
import chunk from 'lodash/chunk'
import React, { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/core/api/axios'
import { useAuth } from '@/features/auth/useAuth'
import { clientDebug } from '@shared/utils/debug'

import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    QuestMapping,
    Share,
} from '@/features/quests/types'
import { INatTaxon } from '@shared/types'
import { z } from 'zod'

const QuestSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    created_at: z.date(),
    updated_at: z.date(),
    starts_at: z.date().nullable(), // Date | null
    ends_at: z.date().nullable(),
    description: z.string().optional(),
    is_private: z.boolean(),
    user_id: z.number().int(),
    username: z.string().optional(),
    status: z.enum(['pending', 'active', 'paused', 'ended']),
    location_name: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    mode: z.enum(['competitive', 'cooperative']),
})

export interface Quest extends z.infer<typeof QuestSchema> {}

export type QuestWithTaxa = Quest & {
    taxon_ids: number[]
    photoUrl?: string | null
    username?: string
}


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
    clientDebug.quests('Fetched quest %s: %o', questId, data)
    return data
}

const fetchQuestByToken = async (token?: string) => {
    const { data } = await api.get(`/quest-sharing/shares/token/${token}`)
    clientDebug.quests('Fetched quest by token: %o', data)
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

// New paginated version for UI-level pagination
export const fetchTaxaPaginated = async ({
    taxonIds,
    pageParam = 1,
    pageSize = 12,
}: {
    taxonIds: number[]
    pageParam?: number
    pageSize?: number
}) => {
    if (!taxonIds || taxonIds.length === 0) {
        return { taxa: [], nextPage: undefined, totalCount: 0 }
    }

    // Filter out invalid taxon IDs
    const validTaxonIds = taxonIds.filter(
        (id) => id && typeof id === 'number' && id > 0
    )

    if (validTaxonIds.length === 0) {
        return { taxa: [], nextPage: undefined, totalCount: 0 }
    }

    // Calculate pagination indices
    const startIndex = (pageParam - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTaxonIds = validTaxonIds.slice(startIndex, endIndex)

    if (paginatedTaxonIds.length === 0) {
        return {
            taxa: [],
            nextPage: undefined,
            totalCount: validTaxonIds.length,
        }
    }

    // Fetch taxa for this page
    const taxonIdChunks = chunk(paginatedTaxonIds, 30)
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

    const taxa = taxaData.flatMap((data) => data)
    const nextPage = endIndex < validTaxonIds.length ? pageParam + 1 : undefined

    return {
        taxa,
        nextPage,
        totalCount: validTaxonIds.length,
    }
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
    clientDebug.quests('Leaderboard: ', data)
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
    const { getValidToken } = useAuth()

    const questQuery = useQuery({
        queryKey: ['quest', questId],
        queryFn: () => fetchQuest(questId),
        initialData: initialData?.quest,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
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
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
    })

    // For pagination, we'll implement UI-level pagination in the component
    // This keeps the data structure simple while allowing progressive loading

    const progressQuery = useQuery({
        queryKey: ['progress', quest?.id],
        queryFn: () => fetchMappingsAndProgress(quest!.id),
        enabled: !!quest?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
    })

    const leaderboardQuery = useQuery({
        queryKey: ['leaderboard', quest?.id],
        queryFn: () => fetchLeaderboard(quest!.id),
        enabled: !!quest?.id,
        staleTime: 1000 * 30, // 30 seconds
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
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

        let eventSource: EventSource | null = null

        const setupEventSource = async () => {
            clientDebug.events('Setting up EventSource for quest: %s', quest.id)

            // Get auth token for owner authentication
            const token = await getValidToken()

            const eventSourceUrl = token
                ? `/api/quests/${quest.id}/events?token=${encodeURIComponent(token)}`
                : `/api/quests/${quest.id}/events`

            clientDebug.events('EventSource URL: %s', eventSourceUrl)
            clientDebug.events(
                'Full EventSource URL: %s',
                window.location.origin + eventSourceUrl
            )
            eventSource = new EventSource(eventSourceUrl, {
                withCredentials: true,
            })

            if (eventSource) {
                eventSource.onopen = () => {
                    clientDebug.events('EventSource connected successfully')
                    clientDebug.events(
                        'EventSource readyState: %s',
                        eventSource!.readyState
                    )
                    clientDebug.events('✅ EventSource URL:', eventSource!.url)
                }

                eventSource.onmessage = (e) => {
                    clientDebug.events(
                        '📨 Owner EventSource RAW message received:',
                        e
                    )
                    clientDebug.events(
                        '📨 Owner EventSource message data:',
                        e.data
                    )
                    clientDebug.events(
                        '📨 Owner EventSource message type:',
                        e.type
                    )
                    clientDebug.quests(
                        '📨 Owner EventSource message origin:',
                        e.origin
                    )
                    clientDebug.events(
                        '📨 Owner EventSource message lastEventId:',
                        e.lastEventId
                    )

                    // Log ALL messages, including comments and empty ones
                    if (!e.data || e.data.trim() === '') {
                        clientDebug.events(
                            '📨 Owner EventSource received empty/comment message, data length:',
                            e.data ? e.data.length : 'null'
                        )
                        clientDebug.events(
                            '📨 Owner EventSource empty message content:',
                            JSON.stringify(e.data)
                        )
                        return
                    }

                    try {
                        const data = JSON.parse(e.data)
                        clientDebug.events('📨 Owner parsed event data:', data)
                        clientDebug.events('📨 Owner event type:', data.type)
                        clientDebug.events(
                            '📨 Owner event payload:',
                            data.payload
                        )

                        if (data.type === 'QUEST_STATUS_UPDATED') {
                            clientDebug.events(
                                '📢 Owner quest status update event:',
                                data.payload.status
                            )
                            toast.info(
                                `Quest status updated to ${data.payload.status}`
                            )
                            queryClient.invalidateQueries({
                                queryKey: ['quest', questId],
                            })
                        } else if (data.type === 'QUEST_EDITING_STARTED') {
                            clientDebug.events('📝 Quest editing started event')
                            toast.info('Quest Editing in Progress', {
                                description: data.payload.message,
                                duration: 8000, // Show for 8 seconds
                            })
                        } else if (
                            ['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(
                                data.type
                            )
                        ) {
                            clientDebug.events(
                                '🐾 Owner species event received, calling handleSpeciesEvent'
                            )
                            clientDebug.events(
                                '🐾 Owner calling handleSpeciesEvent with:',
                                {
                                    data,
                                    questId: quest.id,
                                    hasToken: false,
                                }
                            )
                            handleSpeciesEvent(
                                data,
                                Number(quest.id),
                                queryClient
                            )
                        } else {
                            clientDebug.events(
                                '❓ Owner unknown event type:',
                                data.type
                            )
                        }
                    } catch (error) {
                        clientDebug.events(
                            '❌ Owner error parsing event data:',
                            error
                        )
                        clientDebug.events(
                            '❌ Owner raw event data that failed to parse:',
                            e.data
                        )
                        clientDebug.events('❌ Owner error details:', {
                            message: (error as Error).message,
                            stack: (error as Error).stack,
                        })
                    }
                }

                eventSource.onerror = (error) => {
                    clientDebug.events('❌ EventSource error:', error)
                    clientDebug.events(
                        'EventSource readyState:',
                        eventSource!.readyState
                    )
                    clientDebug.events('EventSource URL:', eventSource!.url)

                    // Log additional error details
                    clientDebug.events('EventSource error event:', {
                        type: error.type,
                        target: error.target,
                        bubbles: error.bubbles,
                        cancelable: error.cancelable,
                    })

                    // Check if connection is closed and attempt reconnection
                    if (eventSource!.readyState === EventSource.CLOSED) {
                        clientDebug.events(
                            'EventSource connection closed, will attempt reconnection on next render'
                        )
                    } else {
                        clientDebug.events(
                            'EventSource attempting automatic reconnection...'
                        )
                    }
                }

                // Add logging for when EventSource closes
                eventSource.addEventListener('close', () => {
                    clientDebug.events('🔌 EventSource connection closed')
                })
            }
        }

        setupEventSource()

        return () => {
            clientDebug.events('🔌 Cleaning up EventSource')
            // Note: eventSource is not accessible here due to async function scope
            // This cleanup will need to be handled differently
        }
    }, [quest?.id, queryClient, questId, getValidToken])

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
        taxaHasNextPage: false, // Will be updated when we implement UI pagination
        fetchNextTaxaPage: () => {
            // Placeholder for future pagination - taxa are loaded in single request
        },
        isError: questQuery.isError, // Only fail on quest data error
        isProgressError: progressQuery.isError,
        isLeaderboardError: leaderboardQuery.isError,
        isTaxaError: taxaQuery.isError,
        updateStatus: updateStatus.mutate,
    }
}

// Focused hook for guest quest access
export const useQuestGuest = ({ token }: { token: string }) => {
    const queryClient = useQueryClient()

    const sharedQuestQuery = useQuery({
        queryKey: ['sharedQuest', token],
        queryFn: () => fetchQuestByToken(token),
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
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
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
    })

    const guestProgressQuery = useQuery({
        queryKey: ['guestProgress', token],
        queryFn: () => fetchGuestProgress(token),
        enabled: !!token,
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
    })

    const guestLeaderboardQuery = useQuery({
        queryKey: ['leaderboard', token],
        queryFn: () => fetchLeaderboardByToken(token),
        enabled: !!token,
        staleTime: 1000 * 30,
        retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors except 429 (rate limit)
            if (
                error?.status &&
                error.status >= 400 &&
                error.status < 500 &&
                error.status !== 429
            ) {
                return false
            }
            // For 429 errors, retry up to 3 times with exponential backoff
            if (error?.status === 429) {
                return failureCount < 3
            }
            // For other errors, retry up to 2 times
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => {
            // For 429 errors, use longer delays
            const baseDelay =
                attemptIndex === 0 ? 1000 : 2000 * 2 ** attemptIndex
            return Math.min(baseDelay, 30000)
        },
    })

    // EventSource for real-time updates
    useEffect(() => {
        if (!quest?.id) return

        clientDebug.events(
            '🔌 Setting up EventSource for guest quest:',
            quest.id
        )
        const eventSourceUrl = `/api/quests/${quest.id}/events?token=${encodeURIComponent(token)}`
        clientDebug.events('🔌 EventSource URL:', eventSourceUrl)
        clientDebug.events(
            '🔌 Full EventSource URL:',
            window.location.origin + eventSourceUrl
        )
        const eventSource = new EventSource(eventSourceUrl, {
            withCredentials: true,
        })

        eventSource.onopen = () => {
            clientDebug.events('✅ Guest EventSource connected successfully')
            clientDebug.events(
                '✅ Guest EventSource readyState:',
                eventSource.readyState
            )
            clientDebug.events('✅ Guest EventSource URL:', eventSource.url)
        }

        eventSource.onmessage = (e) => {
            clientDebug.events('📨 Guest EventSource RAW message received:', e)
            clientDebug.events('📨 Guest EventSource message data:', e.data)
            clientDebug.events('📨 Guest EventSource message type:', e.type)
            clientDebug.events('📨 Guest EventSource message origin:', e.origin)
            clientDebug.events(
                '📨 Guest EventSource message lastEventId:',
                e.lastEventId
            )

            // Log ALL messages, including comments and empty ones
            if (!e.data || e.data.trim() === '') {
                clientDebug.events(
                    '📨 Guest EventSource received empty/comment message, data length:',
                    e.data ? e.data.length : 'null'
                )
                clientDebug.events(
                    '📨 Guest EventSource empty message content:',
                    JSON.stringify(e.data)
                )
                return
            }

            try {
                const data = JSON.parse(e.data)
                clientDebug.events('📨 Guest parsed event data:', data)
                clientDebug.events('📨 Guest event type:', data.type)
                clientDebug.events('📨 Guest event payload:', data.payload)

                if (data.type === 'QUEST_STATUS_UPDATED') {
                    clientDebug.events(
                        '📢 Guest quest status update event:',
                        data.payload.status
                    )
                    toast.info(`Quest status updated to ${data.payload.status}`)
                    queryClient.invalidateQueries({
                        queryKey: ['sharedQuest', token],
                    })
                } else if (data.type === 'QUEST_EDITING_STARTED') {
                    clientDebug.events('📝 Guest quest editing started event')
                    toast.info('Quest Editing in Progress', {
                        description: data.payload.message,
                        duration: 8000, // Show for 8 seconds
                    })
                } else if (
                    ['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(data.type)
                ) {
                    clientDebug.events(
                        '🐾 Guest species event received, calling handleSpeciesEvent'
                    )
                    clientDebug.events(
                        '🐾 Guest calling handleSpeciesEvent with:',
                        {
                            data,
                            questId: quest.id,
                            hasToken: !!token,
                        }
                    )
                    handleSpeciesEvent(
                        data,
                        Number(quest.id),
                        queryClient,
                        token
                    )
                } else {
                    clientDebug.events(
                        '❓ Guest unknown event type:',
                        data.type
                    )
                }
            } catch (error) {
                clientDebug.events('❌ Guest error parsing event data:', error)
                clientDebug.events(
                    '❌ Guest raw event data that failed to parse:',
                    e.data
                )
                clientDebug.events('❌ Guest error details:', {
                    message: (error as Error).message,
                    stack: (error as Error).stack,
                })
            }
        }

        eventSource.onerror = (error) => {
            clientDebug.events('❌ Guest EventSource error:', error)
            clientDebug.events(
                'Guest EventSource readyState:',
                eventSource.readyState
            )
            clientDebug.events('Guest EventSource URL:', eventSource.url)

            // Log additional error details
            clientDebug.events('Guest EventSource error event:', {
                type: error.type,
                target: error.target,
                bubbles: error.bubbles,
                cancelable: error.cancelable,
            })

            // Check if connection is closed and attempt reconnection
            if (eventSource.readyState === EventSource.CLOSED) {
                clientDebug.events(
                    'Guest EventSource connection closed, will attempt reconnection on next render'
                )
            } else {
                clientDebug.events(
                    'Guest EventSource attempting automatic reconnection...'
                )
            }
        }

        // Add logging for when Guest EventSource closes
        eventSource.addEventListener('close', () => {
            clientDebug.events('🔌 Guest EventSource connection closed')
        })

        // Add logging for when Guest EventSource closes
        eventSource.addEventListener('close', () => {
            clientDebug.events('🔌 Guest EventSource connection closed')
        })

        return () => {
            clientDebug.events('🔌 Cleaning up guest EventSource')
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
        isError: sharedQuestQuery.isError, // Only fail on quest data error
        isProgressError: guestProgressQuery.isError,
        isLeaderboardError: guestLeaderboardQuery.isError,
        isTaxaError: taxaQuery.isError,
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
    clientDebug.events('🔥 handleSpeciesEvent called:', {
        type: data.type,
        mappingId: data.payload.mappingId,
        questId,
        hasToken: !!token,
        guestName: data.payload.guestName,
    })

    clientDebug.events('🔥 Processing species event:', {
        eventType: data.type,
        isFound: data.type === 'SPECIES_FOUND',
        isUnfound: data.type === 'SPECIES_UNFOUND',
    })

    // Get data based on whether this is an owner or guest context
    let progressData: ProgressData | undefined
    let sharedQuestData: { taxa_mappings: QuestMapping[] } | undefined
    let mappings: QuestMapping[] | undefined

    if (token) {
        // Guest context - get data from guest-specific queries
        progressData = queryClient.getQueryData(['guestProgress', token])
        sharedQuestData = queryClient.getQueryData(['sharedQuest', token])
        mappings = sharedQuestData?.taxa_mappings as QuestMapping[]
    } else {
        // Owner context - get data from owner-specific queries
        progressData = queryClient.getQueryData(['progress', questId])
        mappings = progressData?.mappings
    }

    const taxaData: INatTaxon[] | undefined = queryClient.getQueryData([
        'taxa',
        questId,
    ])

    clientDebug.events('📊 Data availability:', {
        hasToken: !!token,
        hasProgressData: !!progressData,
        hasSharedQuestData: !!sharedQuestData,
        hasTaxaData: !!taxaData,
        taxaCount: taxaData?.length,
        mappingsSource: token ? 'sharedQuest' : 'progress',
    })

    const guestName = data.payload.guestName || 'A guest'

    clientDebug.events('🗺️ Mappings check:', {
        hasMappings: !!mappings,
        mappingsCount: mappings?.length,
        progressMappingsCount: progressData?.mappings?.length,
        sharedMappingsCount: sharedQuestData?.taxa_mappings?.length,
    })

    if (!mappings) {
        clientDebug.events('❌ No mappings found, returning early')
        return
    }

    const mapping = mappings.find(
        (m: QuestMapping) => m.id === data.payload.mappingId
    )

    clientDebug.events('🔍 Mapping lookup:', {
        mappingId: data.payload.mappingId,
        foundMapping: !!mapping,
        mappingTaxonId: mapping?.taxon_id,
    })

    if (!mapping) {
        clientDebug.events('❌ Mapping not found, returning early')
        return
    }

    const species = taxaData?.find((t: INatTaxon) => t.id === mapping.taxon_id)
    const speciesName = species?.preferred_common_name
        ? species.preferred_common_name
        : species?.name || 'a species'

    clientDebug.events('🐾 Species lookup:', {
        taxonId: mapping.taxon_id,
        foundSpecies: !!species,
        speciesName,
        hasImage: !!species?.default_photo?.square_url,
    })

    const action = data.type === 'SPECIES_FOUND' ? 'found' : 'unmarked'

    clientDebug.events('🍞 Showing toast:', {
        guestName,
        speciesName,
        action,
        hasImage: !!species?.default_photo?.square_url,
    })

    // Show QuestEventToast
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

    // Invalidate relevant queries based on context
    if (token) {
        // Guest context - invalidate guest-specific queries
        queryClient.invalidateQueries({ queryKey: ['guestProgress', token] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard', token] })
        clientDebug.events(
            '🔥 Invalidated guest queries:',
            ['guestProgress', token],
            ['leaderboard', token]
        )
    } else {
        // Owner context - invalidate owner-specific queries
        queryClient.invalidateQueries({ queryKey: ['progress', questId] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard', questId] })
        clientDebug.events(
            '🔥 Invalidated owner queries:',
            ['progress', questId],
            ['leaderboard', questId]
        )
    }

    clientDebug.events('✅ handleSpeciesEvent completed successfully:', {
        type: data.type,
        mappingId: data.payload.mappingId,
        guestName,
        speciesName,
        action,
    })
}

// Common interface for quest data
interface QuestDataResult {
    questData: Quest | null | undefined
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
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean
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
            questData?: Quest | { id: number | string },
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
                clientDebug.quests('Progress updated')

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
    questData?: Quest | { status: string; mode?: string }
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
