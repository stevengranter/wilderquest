import React, { createContext, ReactNode, useContext } from 'react'
import { INatTaxon } from '@shared/types/iNaturalist'
import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    Quest,
    QuestMapping,
    Share,
} from '@/types/questTypes'
import { LoggedInUser } from '@/types/authTypes'
import { useQuest } from '@/hooks/useQuest'
import { ViewMode, useViewMode } from '@/hooks/useViewMode'

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
    isError: boolean
    isProgressError?: boolean
    isLeaderboardError?: boolean
    isTaxaError?: boolean

    // Actions
    updateStatus?: (status: 'pending' | 'active' | 'paused' | 'ended') => void

    // Permissions
    isOwner: boolean
    canEdit: boolean

    // User data
    user?: LoggedInUser

    // View mode
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
}

const QuestContext = createContext<QuestContextType | undefined>(undefined)

interface QuestProviderProps {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
    user?: LoggedInUser
    children: ReactNode
}

export const QuestProvider: React.FC<QuestProviderProps> = ({
    questId,
    token,
    initialData,
    user,
    children,
}) => {
    const questData = useQuest({ questId, token, initialData })
    const { viewMode, setViewMode } = useViewMode()

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
        isError: questData.isError,
        isProgressError: questData.isProgressError,
        isLeaderboardError: questData.isLeaderboardError,
        isTaxaError: questData.isTaxaError,

        // Actions
        updateStatus: questData.updateStatus,

        // Permissions
        isOwner: questData.isOwner,
        canEdit: questData.canEdit,

        // User data
        user: user,

        // View mode
        viewMode,
        setViewMode,
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
