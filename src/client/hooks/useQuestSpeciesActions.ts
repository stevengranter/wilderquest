import { useCallback } from 'react'
import { INatTaxon } from '@shared/types/iNaturalist'
import {
    DetailedProgress,
    QuestMapping,
    ClientQuest,
    Quest,
    Share,
} from '@/types/questTypes'
import { LoggedInUser } from '@/types/authTypes'
import { useSpeciesProgress } from './useSpeciesProgress'
import { useSpeciesActions } from './useSpeciesActions'

type TaxonWithProgress = INatTaxon & {
    mapping: QuestMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

export const useQuestSpeciesActions = ({
    isOwner,
    token,
    user,
    share,
    questData,
    detailedProgress,
}: {
    isOwner: boolean
    token?: string
    user?: LoggedInUser
    share?: Share
    questData: Quest
    detailedProgress?: DetailedProgress[]
}) => {
    // Convert Quest to ClientQuest
    const clientQuestData: ClientQuest = {
        ...questData,
        username: questData.username || '',
    }
    const { handleProgressUpdate, getAvatarOverlay } = useSpeciesProgress({
        mappings: [], // This will be passed from the component
        detailedProgress,
    })

    const { canInteract } = useSpeciesActions({
        isOwner,
        token,
        questData: clientQuestData,
        user,
        share,
    })

    const handleProgressUpdateWrapper = useCallback(
        async (taxon: TaxonWithProgress) => {
            if (!taxon.mapping) return
            await handleProgressUpdate(
                taxon.mapping,
                isOwner,
                user,
                share,
                clientQuestData,
                token
            )
        },
        [handleProgressUpdate, isOwner, user, share, clientQuestData, token]
    )

    const getAvatarOverlayWrapper = useCallback(
        (taxon: TaxonWithProgress) => {
            return getAvatarOverlay(taxon.recentEntries, clientQuestData.mode)
        },
        [getAvatarOverlay, clientQuestData.mode]
    )

    const getFoundButtonProps = useCallback(
        (taxon: TaxonWithProgress) => {
            if (!taxon.mapping) {
                return null
            }

            // Check if user can interact with this quest
            const canUserInteract = canInteract
                ? Boolean(canInteract(clientQuestData.status))
                : clientQuestData.status === 'active'

            // Don't render if can't interact or not owner and no token
            if (!canUserInteract || (!isOwner && !token)) {
                return null
            }

            // Check if current user has already marked this species as found
            const currentUserDisplayName = isOwner
                ? user?.username
                : share?.guest_name
            const userHasFound = detailedProgress?.some(
                (progress) =>
                    progress.mapping_id === taxon.mapping!.id &&
                    progress.display_name === currentUserDisplayName
            )

            // In competitive mode, if someone else has found it, disable the button
            const isDisabledInCompetitiveMode =
                clientQuestData.mode === 'competitive' &&
                taxon.progressCount > 0 &&
                !userHasFound

            return {
                disabled:
                    clientQuestData.status !== 'active' ||
                    isDisabledInCompetitiveMode,
                variant: (taxon.progressCount > 0 ? 'neutral' : 'default') as
                    | 'neutral'
                    | 'default',
                children: userHasFound ? 'Mark as unfound' : 'Found',
                onClick: async () => {
                    await handleProgressUpdateWrapper(taxon)
                },
                fullWidth: true,
            }
        },
        [
            detailedProgress,
            isOwner,
            user,
            share,
            token,
            clientQuestData.status,
            clientQuestData.mode,
            handleProgressUpdateWrapper,
            canInteract,
        ]
    )

    return {
        handleProgressUpdateWrapper,
        getAvatarOverlayWrapper,
        getFoundButtonProps,
        canInteract,
    }
}
