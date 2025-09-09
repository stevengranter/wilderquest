import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { INatTaxon } from '@shared/types/iNaturalist'
import {
    Quest,
    QuestMapping,
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    QuestWithTaxa,
    Share,
    ProgressData,
} from '@/types/questTypes'
import {
    fetchQuest,
    fetchQuestByToken,
    fetchTaxa,
    fetchMappingsAndProgress,
    fetchGuestProgress,
    fetchLeaderboard,
    fetchLeaderboardByToken,
} from './helpers/fetchQueries'

interface BaseQuestConfig {
    questId?: string | number
    token?: string
    initialData?: {
        quest?: Quest
        taxa?: INatTaxon[]
    }
}

interface QuestBaseResult {
    questData: Quest | null | undefined
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    leaderboard?: LeaderboardEntry[]
    share?: Share // For guest context
    isLoading: boolean
    isTaxaLoading: boolean
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    isError: boolean
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean
    fetchNextTaxaPage: () => void
}

export const useQuestBase = ({
    questId,
    token,
    initialData,
}: BaseQuestConfig): QuestBaseResult => {
    const queryKey = token ? ['sharedQuest', token] : ['quest', questId]
    const isEnabled = !!(token || questId)

    const questQuery = useQuery({
        queryKey,
        queryFn: async () => {
            const result = token
                ? await fetchQuestByToken(token)
                : await fetchQuest(questId)

            // If result is null/undefined, return a fallback
            if (!result) {
                return token
                    ? {
                          quest: null,
                          share: null,
                          taxa_mappings: [],
                          progress: [],
                      }
                    : null
            }

            return result
        },
        initialData: token ? undefined : initialData?.quest,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: isEnabled,
        retry: (failureCount, error) => {
            return failureCount < 3
        },
    })

    // Extract quest and share data with defensive checks
    let quest: Quest | null = null
    let share: Share | undefined = undefined

    if (token) {
        // For token-based queries, data should have quest and share properties
        quest = questQuery.data?.quest
        share = questQuery.data?.share
    } else {
        // For questId-based queries, data is the quest directly
        quest = questQuery.data
    }
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
        queryKey: token ? ['guestProgress', token] : ['progress', quest?.id],
        queryFn: token
            ? () => fetchGuestProgress(token)
            : () => fetchMappingsAndProgress(quest!.id),
        enabled: token ? !!token : !!quest?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const leaderboardQuery = useQuery({
        queryKey: token ? ['leaderboard', token] : ['leaderboard', quest?.id],
        queryFn: token
            ? () => fetchLeaderboardByToken(token)
            : () => fetchLeaderboard(quest!.id),
        enabled: token ? !!token : !!quest?.id,
        staleTime: 1000 * 30, // 30 seconds
    })

    // Return unified result
    return {
        questData: quest,
        taxa: taxaQuery.data || [],
        mappings: token
            ? (questQuery.data?.taxa_mappings as QuestMapping[] | undefined) ||
              []
            : ((progressQuery.data as ProgressData)?.mappings as
                  | QuestMapping[]
                  | undefined),
        aggregatedProgress: progressQuery.data?.aggregatedProgress,
        detailedProgress: progressQuery.data?.detailedProgress,
        leaderboard: leaderboardQuery.data,
        share: token ? share : undefined,
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
        isError: questQuery.isError,
        isProgressError: progressQuery.isError,
        isLeaderboardError: leaderboardQuery.isError,
        isTaxaError: taxaQuery.isError,
    }
}
