import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useQuestBase } from './useQuestBase'
import { useQuestEvents } from './useQuestEvents'
import axiosInstance from '@/lib/axios'
import { toast } from 'sonner'
import { Quest } from '@/types/questTypes'
import { INatTaxon } from '@shared/types/iNaturalist'

export const useQuestOwner = ({
    questId,
    initialData,
}: {
    questId: string | number
    initialData?: { quest?: Quest; taxa?: INatTaxon[] }
}) => {
    const queryClient = useQueryClient()
    const { getValidToken } = useAuth()

    const baseResult = useQuestBase({ questId, initialData })

    useQuestEvents({
        questId: Number(questId),
        getValidToken,
        isOwner: true,
    })

    // Owner-specific mutation for updating quest status
    const updateStatus = useMutation({
        mutationFn: (status: 'pending' | 'active' | 'paused' | 'ended') =>
            axiosInstance.patch(`/quests/${questId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quest', questId] })
        },
        onError: () => toast.error('Failed to update quest status'),
    })

    return {
        ...baseResult,
        updateStatus: updateStatus.mutate,
    }
}
