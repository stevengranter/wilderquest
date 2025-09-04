import React, { createContext, ReactNode, useContext } from 'react'
import { useQuestDisplay } from '@/hooks/useQuest'
import { INatTaxon } from '@shared/types/iNatTypes'
// Import QuestMapping type
import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    QuestMapping,
    Share,
} from '@/features/quests/types'
import { Quest } from '../../server/models/quests'

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
    const questData = useQuestDisplay({ questId, token, initialData })

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
