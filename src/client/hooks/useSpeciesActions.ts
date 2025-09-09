// Hook for species actions and UI state
import { Quest, Share } from '@/types/questTypes'
import { useCallback } from 'react'

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
        [isOwner, token],
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