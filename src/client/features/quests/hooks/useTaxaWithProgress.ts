import { INatTaxon } from '@shared/types'
import { useMemo } from 'react'
import { AggregatedProgress, DetailedProgress, QuestMapping } from '@/features/quests/types'

export const useTaxaWithProgress = (
    taxa: INatTaxon[] | undefined,
    mappings: QuestMapping[] | undefined,
    aggregatedProgress: AggregatedProgress[] | undefined,
    detailedProgress: DetailedProgress[] | undefined
) => {
    return useMemo(() => {
        if (!taxa) return []

        const enrichedTaxa = taxa.map((taxon) => {
            const mapping = mappings?.find((m) => m.taxon_id === taxon.id)
            const progressCount =
                mapping?.id && aggregatedProgress
                    ? aggregatedProgress.find(
                    (p) => p.mapping_id === mapping.id
                )?.count || 0
                    : 0
            const recentEntries =
                mapping?.id && detailedProgress
                    ? detailedProgress
                        .filter((d) => d.mapping_id === mapping.id)
                        .slice(0, 3)
                    : []
            return {
                ...taxon,
                mapping,
                progressCount,
                recentEntries,
                isFound: progressCount > 0
            }
        })

        // Create stable groups instead of sorting
        const notFound = enrichedTaxa.filter(taxon => !taxon.isFound)
        const found = enrichedTaxa.filter(taxon => taxon.isFound)

        return [...notFound, ...found]
    }, [taxa, mappings, aggregatedProgress, detailedProgress])
}