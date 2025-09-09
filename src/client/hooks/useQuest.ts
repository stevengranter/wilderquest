import { useAuth } from '@/hooks/useAuth'
import { INatTaxon } from '@shared/types/iNaturalist'
import { Quest, QuestDataResult } from '@/types/questTypes'
import { useQuestOwner } from '@/hooks/useQuest/useQuestOwner'
import { useQuestGuest } from '@/hooks/useQuest/useQuestGuest'

// Hook that composes owner/guest hooks
export const useQuest = ({
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

    // Owner access when questId is provided AND user is authenticated AND owns the quest
    const isOwner =
        !!questId &&
        isAuthenticated &&
        questData.questData?.user_id === user?.id
    const canEdit = isOwner && questData.questData?.status !== 'ended'

    return {
        ...questData,
        isOwner,
        canEdit,
    }
}
