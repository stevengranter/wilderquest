import { useAuth } from '@/hooks/useAuth'
import { INatTaxon } from '@shared/types/iNaturalist'
import { Quest, QuestDataResult } from '@/types/questTypes'
import { useQuestData } from './useQuestData'
import { useQuestEvents } from './useQuestEvents'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios'
import { toast } from 'sonner'

export const useQuest = ({
    questId,
    token,
    initialData,
}: {
    questId?: string | number
    token?: string
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
}): QuestDataResult & {
    isOwner: boolean
    canEdit: boolean
    updateStatus?: (status: 'pending' | 'active' | 'paused' | 'ended') => void
} => {
    const { isAuthenticated, user, getValidToken } = useAuth()
    const queryClient = useQueryClient()

    const questData = useQuestData({ questId, token, initialData })

    useQuestEvents({
        questId: questData.questData?.id || 0,
        token,
        isOwner:
            !!questId &&
            isAuthenticated &&
            questData.questData?.user_id === user?.id,
        getValidToken,
        isAuthenticated,
        user,
        share: questData.share,
    })

    const isOwner =
        !!questId &&
        isAuthenticated &&
        questData.questData?.user_id === user?.id
    const canEdit = isOwner && questData.questData?.status !== 'ended'

    const updateStatusMutation = useMutation({
        mutationFn: (status: 'pending' | 'active' | 'paused' | 'ended') =>
            axiosInstance.patch(`/quests/${questId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quest', questId] })
        },
        onError: () => toast.error('Failed to update quest status'),
    })

    return {
        ...questData,
        isOwner,
        canEdit,
        updateStatus: isOwner ? updateStatusMutation.mutate : undefined,
    }
}
