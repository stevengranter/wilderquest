import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { SpeciesCardWithObservations } from '@/components/SpeciesCardWithObservations'
import { SpeciesCardSkeleton } from '@/components/SpeciesCard'
import { FoundButton } from '@/components/FoundButton'
import { QuestListView } from './QuestListView'
import { QuestMapView } from './QuestMapView'
import { INatTaxon } from '@shared/types/iNaturalist'
import { LoggedInUser } from '@/types/authTypes'
import {
    AggregatedProgress,
    DetailedProgress,
    QuestMapping,
    QuestStatus,
    Share,
    ClientQuest,
} from '@/types/questTypes'
import { useQuestContext } from '@/components/QuestContext'
import { LayoutGroup } from 'motion/react'
import { useSpeciesProgress } from '@/hooks/useSpeciesProgress'
import { useSpeciesActions } from '@/hooks/useSpeciesActions'
import { useEnrichedTaxa } from '../hooks/useEnrichedTaxa'

// Use QuestMapping instead of defining TaxonMapping
type TaxonMapping = QuestMapping

type TaxonWithProgress = INatTaxon & {
    mapping: TaxonMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

type QuestSpeciesProps = {
    // Only user prop needed - everything else comes from QuestContext
    user?: LoggedInUser
}

export const QuestSpecies = ({ user }: QuestSpeciesProps) => {
    // Use existing context and hooks
    const questContext = useQuestContext()
    const { viewMode } = questContext

    // Extract all data from context
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
    } = questContext

    // Handle null questData
    if (!questData) {
        return <div>Loading...</div>
    }

    // Convert Quest to ClientQuest
    const clientQuestData: ClientQuest = {
        ...questData,
        username: questData.username || '',
    }

    const taxaWithProgress = useEnrichedTaxa(
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress
    )
    const { handleProgressUpdate, getAvatarOverlay } = useSpeciesProgress({
        mappings,
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

    // Extract action button rendering
    const renderActionButton = useCallback(
        (taxon: TaxonWithProgress) => {
            if (!taxon.mapping) {
                return null
            }

            return (
                <div className="p-2">
                    <FoundButton
                        mapping={taxon.mapping}
                        progressCount={taxon.progressCount}
                        detailedProgress={detailedProgress}
                        questContext={{
                            questData: clientQuestData as ClientQuest,
                            user,
                            share,
                            token,
                            isOwner,
                            canInteract: (status?: string) =>
                                Boolean(canInteract(status)),
                        }}
                        onClick={async () => {
                            await handleProgressUpdateWrapper(taxon)
                        }}
                        fullWidth={true}
                    />
                </div>
            )
        },
        [
            detailedProgress,
            isOwner,
            user,
            share,
            token,
            questData.status,
            handleProgressUpdateWrapper,
            canInteract,
        ]
    )

    const renderSkeletons = useCallback(
        (
            keyPrefix: string,
            count: number = 6,
            phase: 'data' | 'image' | 'complete' = 'data'
        ) => {
            return Array.from({
                length: Math.min(mappings?.length || count, count),
            }).map((_, i) => (
                <motion.div
                    key={`skeleton-${keyPrefix}-${i}`}
                    className="relative"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        delay: i * 0.05, // Stagger animation
                        layout: {
                            duration: 0.4,
                            type: 'spring',
                            damping: 25,
                            stiffness: 200,
                        },
                    }}
                >
                    <SpeciesCardSkeleton phase={phase} />
                </motion.div>
            ))
        },
        [mappings?.length]
    )

    const renderSpeciesCard = useCallback(
        (taxon: TaxonWithProgress) => {
            return (
                <motion.div
                    key={taxon.id}
                    className="relative"
                    // layout
                    // layoutId={`species-${taxon.id}`}
                    // initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    // animate={{ opacity: 1, y: 0, scale: 1 }}
                    // exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    // transition={{
                    //     layout: {
                    //         duration: 0.4,
                    //         type: 'spring',
                    //         damping: 25,
                    //         stiffness: 200,
                    //     },
                    //     default: { duration: 0.3 },
                    // }}
                >
                    <SpeciesCardWithObservations
                        species={taxon}
                        found={taxon.progressCount > 0}
                        avatarOverlay={getAvatarOverlayWrapper(taxon)}
                        actionArea={renderActionButton(taxon)}
                    />
                </motion.div>
            )
        },
        [questData, getAvatarOverlayWrapper, renderActionButton]
    )

    return (
        <>
            {/* View Content */}
            {viewMode === 'grid' && (
                <div className="space-y-8">
                    {/* Combined section for all species */}
                    <div>
                        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 auto-rows-fr">
                            <LayoutGroup>
                                <AnimatePresence mode="popLayout">
                                    {isTaxaLoading
                                        ? renderSkeletons(
                                              'all-species',
                                              mappings?.length || 6
                                          )
                                        : taxaWithProgress.map((taxon) =>
                                              renderSpeciesCard(taxon)
                                          )}
                                </AnimatePresence>
                            </LayoutGroup>
                        </motion.div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <QuestListView taxaWithProgress={taxaWithProgress} />
            )}

            {viewMode === 'map' && taxa && mappings && (
                <QuestMapView className="h-96 w-full rounded-lg border" />
            )}
        </>
    )
}
