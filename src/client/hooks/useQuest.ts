import QuestEventToast from '@/components/ui/QuestEventToast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chunk } from 'lodash'
import React, { useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/api/api'

import { Quest } from '../../server/repositories/QuestRepository'

import { AggregatedProgress, DetailedProgress } from '@/features/quests/types'
import { INatTaxon } from '@shared/types/iNatTypes'

type TaxonMapping = { id: number; quest_id: number; taxon_id: number }
type ProgressData = {
    mappings: TaxonMapping[]
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
    const taxonIdChunks = chunk(taxonIds, 30)
    const taxaData = await Promise.all(
        taxonIdChunks.map(async (ids) => {
            const { data } = await api.get(
                `/iNatAPI/taxa/${ids.join(',')}?fields=all`
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

export const useQuest = ({
    questId,
    token,
    initialData,
}: {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
}) => {
    const queryClient = useQueryClient()

    const questQuery = useQuery({
        queryKey: ['quest', questId],
        queryFn: () => fetchQuest(questId),
        initialData: initialData?.quest,
        enabled: !!questId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const sharedQuestQuery = useQuery({
        queryKey: ['sharedQuest', token],
        queryFn: () => fetchQuestByToken(token),
        enabled: !!token,
    })

    const quest = questQuery.data || sharedQuestQuery.data?.quest
    const share = sharedQuestQuery.data?.share
    console.log('quest', quest)

    const taxaQuery = useQuery({
        queryKey: ['taxa', questId || token],
        queryFn: () => fetchTaxa(quest?.taxon_ids || []),
        initialData: initialData?.taxa,
        enabled: !!quest?.taxon_ids?.length,
        staleTime: 1000 * 60 * 5, // 5 minutes - match quest query
    })

    const taxaData = taxaQuery.data || []
    const isTaxaLoading = questQuery.isLoading || taxaQuery.isLoading
    const isTaxaError = taxaQuery.isError

    const progressQuery = useQuery({
        queryKey: ['progress', quest?.id],
        queryFn: () => fetchMappingsAndProgress(quest!.id),
        enabled: !!quest?.id && !!questId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
    const guestProgressQuery = useQuery({
        queryKey: ['guestProgress', token],
        queryFn: () => fetchGuestProgress(token!),
        enabled: !!token,
    })
    const leaderboardQuery = useQuery({
        queryKey: ['leaderboard', quest?.id],
        queryFn: () => fetchLeaderboard(quest!.id),
        enabled: !!quest?.id && !!questId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const guestLeaderboardQuery = useQuery({
        queryKey: ['leaderboard', token],
        queryFn: () => fetchLeaderboardByToken(token!),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
    })

    const updateStatus = useMutation({
        mutationFn: (status: 'pending' | 'active' | 'paused' | 'ended') =>
            api.patch(`/quests/${quest!.id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quest', questId] })
            queryClient.invalidateQueries({ queryKey: ['sharedQuest', token] })
        },
        onError: () => toast.error('Failed to update quest status'),
    })

    // useEffect for side-effects previously done in onSuccess
    useEffect(() => {
        if (progressQuery.isSuccess && progressQuery.data) {
            console.log('Progress data:', progressQuery.data)
        }
    }, [progressQuery.isSuccess, progressQuery.data])

    useEffect(() => {
        if (guestProgressQuery.isSuccess && guestProgressQuery.data) {
            console.log('Guest progress data:', guestProgressQuery.data)
        }
    }, [guestProgressQuery.isSuccess, guestProgressQuery.data])

    useEffect(() => {
        if (!quest?.id) return

        const eventSource = new EventSource(`/api/quests/${quest.id}/events`)

        eventSource.onmessage = (e) => {
            const data = JSON.parse(e.data)

            if (data.type === 'QUEST_STATUS_UPDATED') {
                toast.info(`Quest status updated to ${data.payload.status}`)
                queryClient.invalidateQueries({ queryKey: ['quest', questId] })
                queryClient.invalidateQueries({
                    queryKey: ['sharedQuest', token],
                })
            } else if (
                ['SPECIES_FOUND', 'SPECIES_UNFOUND'].includes(data.type)
            ) {
                // Get fresh data from the query cache to build the toast message.
                // This avoids adding query data to the useEffect dependency array,
                // which would cause the EventSource to reconnect every time the data changes.
                const progressData: ProgressData | undefined =
                    queryClient.getQueryData(['progress', quest.id])
                const sharedQuestData:
                    | { taxa_mappings: TaxonMapping[] }
                    | undefined = queryClient.getQueryData([
                    'sharedQuest',
                    token,
                ])
                const taxaData: INatTaxon[] | undefined =
                    queryClient.getQueryData(['taxa', questId || token])

                const guestName =
                    data.payload.guestName ||
                    (data.payload.owner ? 'The owner' : 'A guest')

                const mappings =
                    progressData?.mappings || sharedQuestData?.taxa_mappings

                if (!mappings) return

                const mapping = mappings.find(
                    (m: TaxonMapping) => m.id === data.payload.mappingId
                )

                if (!mapping) return

                const species = taxaData?.find(
                    (t: INatTaxon) => t.id === mapping.taxon_id
                )
                const speciesName = species?.preferred_common_name
                    ? species.preferred_common_name
                    : species?.name || 'a species'

                const action =
                    data.type === 'SPECIES_FOUND' ? 'found' : 'unmarked'

                toast(
                    React.createElement(QuestEventToast, {
                        guestName: guestName,
                        speciesName: speciesName,
                        action: action,
                        speciesImage: species?.default_photo?.square_url,
                    }),
                    {
                        position: 'top-left',
                        style: {
                            padding:0,
                            margin:0,
                            width:"90svw",
                            borderWidth:0,
                            boxShadow:"none",
                            background:'none',
                        outline:"none"}
                        // style: {
                        //     width: '100vw',
                        //     maxWidth: '90vw',
                        // },
                    }
                )

                // Invalidate queries to refetch data and update the UI
                queryClient.invalidateQueries({
                    queryKey: ['progress', quest.id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['guestProgress', token],
                })
                queryClient.invalidateQueries({
                    queryKey: ['sharedQuest', token],
                })
                if (token) {
                    queryClient.invalidateQueries({
                        queryKey: ['leaderboard', token],
                    })
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ['leaderboard', quest.id],
                    })
                }
            }
        }

        return () => {
            eventSource.close()
        }
    }, [quest?.id, queryClient, questId, token])

    const finalProgress = questId
        ? progressQuery.data
        : {
              ...guestProgressQuery.data,
              mappings: sharedQuestQuery.data?.taxa_mappings,
          }

    const leaderboard = token
        ? guestLeaderboardQuery.data
        : leaderboardQuery.data

    return {
        questData: quest,
        taxa: taxaData,
        share,
        ...finalProgress,
        isLoading:
            questQuery.isLoading ||
            sharedQuestQuery.isLoading ||
            progressQuery.isLoading ||
            guestProgressQuery.isLoading ||
            leaderboardQuery.isLoading ||
            guestLeaderboardQuery.isLoading,
        isTaxaLoading,
        isTaxaFetchingNextPage: taxaQuery.isFetchingNextPage,
        taxaHasNextPage: taxaQuery.hasNextPage,
        fetchNextTaxaPage: taxaQuery.fetchNextPage,
        isError:
            questQuery.isError ||
            sharedQuestQuery.isError ||
            leaderboardQuery.isError ||
            guestLeaderboardQuery.isError ||
            isTaxaError,
        updateStatus: updateStatus.mutate,
        leaderboard,
    }
}
