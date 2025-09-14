import { useQuery } from '@tanstack/react-query'
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
} from './fetchQueries'

interface QuestDataConfig {
    questId?: string | number
    token?: string
    initialData?: {
        quest?: Quest
        taxa?: INatTaxon[]
    }
}

interface QuestDataResult {
    // Quest data
    questData: Quest | null | undefined
    share?: Share

    // Related data
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    leaderboard?: LeaderboardEntry[]

    // Loading states
    isLoading: boolean
    isTaxaLoading: boolean
    isError: boolean
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean
}

export const useQuestData = ({
    questId,
    token,
    initialData,
}: QuestDataConfig): QuestDataResult => {
    const queryKey = token ? ['sharedQuest', token] : ['quest', questId]
    const isEnabled = !!(token || questId)

    // Main quest data query
    const questQuery = useQuery({
        queryKey,
        queryFn: async () => {
            const result = token
                ? await fetchQuestByToken(token)
                : await fetchQuest(questId)

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
        retry: (failureCount) => failureCount < 3,
    })

    // Extract quest and share data
    let quest: Quest | null = null
    let share: Share | undefined = undefined

    if (token) {
        quest = questQuery.data?.quest
        share = questQuery.data?.share
    } else {
        quest = questQuery.data
    }

    // Taxa data query
    const taxaQuery = useQuery({
        queryKey: ['taxa', quest?.id],
        queryFn: () => fetchTaxa((quest as QuestWithTaxa)?.taxon_ids || []),
        initialData: initialData?.taxa,
        enabled:
            questQuery.isSuccess &&
            !!(quest as QuestWithTaxa)?.taxon_ids?.length,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Progress data query
    const progressQuery = useQuery({
        queryKey: token ? ['guestProgress', token] : ['progress', quest?.id],
        queryFn: token
            ? () => fetchGuestProgress(token)
            : () => fetchMappingsAndProgress(quest!.id),
        enabled: token ? !!token : !!quest?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Leaderboard query
    const leaderboardQuery = useQuery({
        queryKey: token ? ['leaderboard', token] : ['leaderboard', quest?.id],
        queryFn: token
            ? () => fetchLeaderboardByToken(token)
            : () => fetchLeaderboard(quest!.id),
        enabled: token ? !!token : !!quest?.id,
        staleTime: 1000 * 30, // 30 seconds
    })

    return {
        questData: quest,
        share: token ? share : undefined,
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
        isLoading:
            questQuery.isLoading ||
            progressQuery.isLoading ||
            leaderboardQuery.isLoading,
        isTaxaLoading: questQuery.isLoading || taxaQuery.isLoading,
        isError: questQuery.isError,
        isProgressError: progressQuery.isError,
        isLeaderboardError: leaderboardQuery.isError,
        isTaxaError: taxaQuery.isError,
    }
}
