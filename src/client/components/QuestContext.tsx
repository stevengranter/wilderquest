import React, { createContext, ReactNode, useContext } from 'react'
import { useQuest } from '@/hooks/useQuest'
import { INatTaxon } from '@shared/types/iNaturalist'
import { AggregatedProgress, DetailedProgress, LeaderboardEntry, Quest, QuestMapping, Share } from '@/types/questTypes'

interface QuestContextType {
    // Quest data
    questData: Quest | null | undefined
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    leaderboard?: LeaderboardEntry[]
    share?: Share
    token?: string

    // Loading states
    isLoading: boolean
    isTaxaLoading: boolean
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    isError: boolean
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean

    // Actions
    updateStatus?: (status: 'pending' | 'active' | 'paused' | 'ended') => void
    fetchNextTaxaPage: () => void

    // Permissions
    isOwner: boolean
    canEdit: boolean
}

const QuestContext = createContext<QuestContextType | undefined>(undefined)

interface QuestProviderProps {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
    children: ReactNode
}

export const QuestProvider: React.FC<QuestProviderProps> = ({
    questId,
    token,
    initialData,
    children,
}) => {
    const questData = useQuest({ questId, token, initialData })

    const contextValue: QuestContextType = {
        // Quest data
        questData: questData.questData,
        taxa: questData.taxa,
        mappings: questData.mappings,
        aggregatedProgress: questData.aggregatedProgress,
        detailedProgress: questData.detailedProgress,
        leaderboard: questData.leaderboard,
        share: questData.share,
        token: token,

        // Loading states
        isLoading: questData.isLoading,
        isTaxaLoading: questData.isTaxaLoading,
        isTaxaFetchingNextPage: questData.isTaxaFetchingNextPage,
        taxaHasNextPage: questData.taxaHasNextPage,
        isError: questData.isError,
        isProgressError: questData.isProgressError,
        isLeaderboardError: questData.isLeaderboardError,
        isTaxaError: questData.isTaxaError,

        // Actions
        updateStatus: questData.updateStatus,
        fetchNextTaxaPage: questData.fetchNextTaxaPage,

        // Permissions
        isOwner: questData.isOwner,
        canEdit: questData.canEdit,
    }

    return (
        <QuestContext.Provider value={contextValue}>
            {children}
        </QuestContext.Provider>
    )
}

export const useQuestContext = () => {
    const context = useContext(QuestContext)
    if (context === undefined) {
        throw new Error('useQuestContext must be used within a QuestProvider')
    }
    return context
}
