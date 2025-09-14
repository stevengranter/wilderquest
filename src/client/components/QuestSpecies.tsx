import { LoggedInUser } from '@/types/authTypes'
import { useQuestContext } from '@/components/QuestContext'
import { useQuestSpeciesData } from '@/hooks/useQuestSpeciesData'
import { useQuestSpeciesActions } from '@/hooks/useQuestSpeciesActions'
import { QuestSpeciesGridView } from './QuestSpeciesGridView'
import { QuestSpeciesListView } from './QuestSpeciesListView'
import { QuestSpeciesMapView } from './QuestSpeciesMapView'

type QuestSpeciesProps = {
    // Only user prop needed - everything else comes from QuestContext
    user?: LoggedInUser
}

export const QuestSpecies = ({ user }: QuestSpeciesProps) => {
    const {
        questData,
        taxa,
        mappings,
        detailedProgress,
        aggregatedProgress,
        isTaxaLoading,
        isOwner,
        token,
        share,
        viewMode
    } = useQuestContext()

    // Handle null questData
    if (!questData) {
        return <div>Loading...</div>
    }

    const { taxaWithProgress } = useQuestSpeciesData({
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress,
        questData,
    })

    const { getAvatarOverlayWrapper, getFoundButtonProps } =
        useQuestSpeciesActions({
            isOwner,
            token,
            user,
            share,
            questData,
            detailedProgress,
        })

    const renderCurrentView = () => {
        switch (viewMode) {
            case 'grid':
                return (
                    <QuestSpeciesGridView
                        taxaWithProgress={taxaWithProgress}
                        isTaxaLoading={isTaxaLoading}
                        mappings={mappings}
                        getAvatarOverlayWrapper={getAvatarOverlayWrapper}
                        getFoundButtonProps={getFoundButtonProps}
                    />
                )
            case 'list':
                return (
                    <QuestSpeciesListView taxaWithProgress={taxaWithProgress} />
                )
            case 'map':
                return <QuestSpeciesMapView taxa={taxa} mappings={mappings} />
            default:
                return null
        }
    }

    return <>{renderCurrentView()}</>
}
