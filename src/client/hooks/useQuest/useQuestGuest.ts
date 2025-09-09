import { useQuestBase } from './useQuestBase'
import { useQuestEvents } from './useQuestEvents'

export const useQuestGuest = ({ token }: { token: string }) => {
    const baseResult = useQuestBase({ token })

    useQuestEvents({
        questId: baseResult.questData?.id || 0,
        token,
        isOwner: false,
    })

    console.log('useQuestGuest returning:', {
        questData: !!baseResult.questData,
        taxaCount: baseResult.taxa?.length,
        mappingsCount: baseResult.mappings?.length,
        share: !!baseResult.share,
    })

    return {
        ...baseResult,
        share: baseResult.share,
        updateStatus: undefined, // Guests cannot update quest status
    }
}
;``
