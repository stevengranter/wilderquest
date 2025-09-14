import { useMemo } from 'react'
import { INatTaxon } from '@shared/types/iNaturalist'
import {
    DetailedProgress,
    QuestMapping,
    ClientQuest,
    Quest,
    AggregatedProgress,
} from '@/types/questTypes'
import { useEnrichedTaxa } from './useEnrichedTaxa'

export const useQuestSpeciesData = ({
    taxa,
    mappings,
    aggregatedProgress,
    detailedProgress,
    questData,
}: {
    taxa: INatTaxon[]
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    detailedProgress?: DetailedProgress[]
    questData: Quest
}) => {
    // Enrich taxa with progress data
    const taxaWithProgress = useEnrichedTaxa(
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress
    )

    const clientQuestData: ClientQuest = useMemo(
        () => ({
            ...questData,
            username: questData.username || '',
        }),
        [questData]
    )

    return {
        taxaWithProgress,
        clientQuestData,
    }
}
