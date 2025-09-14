import { QuestListView } from './QuestListView'
import { INatTaxon } from '@shared/types/iNaturalist'
import { DetailedProgress, QuestMapping } from '@/types/questTypes'

type TaxonWithProgress = INatTaxon & {
    mapping: QuestMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

interface QuestSpeciesListViewProps {
    taxaWithProgress: TaxonWithProgress[]
}

export const QuestSpeciesListView = ({
    taxaWithProgress,
}: QuestSpeciesListViewProps) => {
    return <QuestListView taxaWithProgress={taxaWithProgress} />
}
