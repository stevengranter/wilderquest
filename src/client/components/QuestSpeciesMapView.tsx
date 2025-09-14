import { QuestMapView } from './QuestMapView'
import { INatTaxon } from '@shared/types/iNaturalist'
import { QuestMapping } from '@/types/questTypes'

interface QuestSpeciesMapViewProps {
    taxa?: INatTaxon[]
    mappings?: QuestMapping[]
}

export const QuestSpeciesMapView = ({
    taxa,
    mappings,
}: QuestSpeciesMapViewProps) => {
    if (!taxa || !mappings) {
        return null
    }

    return <QuestMapView className="h-96 w-full rounded-lg border" />
}
