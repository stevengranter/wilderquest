import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import {
    ClientQuest,
    SpeciesCardWithObservations,
} from '@/components/SpeciesCardWithObservations'
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
} from '@/types/questTypes'
import { useSpeciesProgress } from '@/hooks/useSpeciesProgress'
import { useSpeciesActions } from '@/hooks/useSpeciesActions'
import { useTaxaWithProgress } from '../hooks/useTaxaWithProgress'

// Use QuestMapping instead of defining TaxonMapping
type TaxonMapping = QuestMapping

type TaxonWithProgress = INatTaxon & {
    mapping: TaxonMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

type QuestSpeciesProps = {
    questData: ClientQuest
    isOwner: boolean
    token: string | undefined
    share: Share | undefined
    detailedProgress: DetailedProgress[] | undefined
    aggregatedProgress: AggregatedProgress[] | undefined
    taxa: INatTaxon[] | undefined
    mappings: TaxonMapping[] | undefined
    updateStatus?: (status: QuestStatus) => void
    isTaxaLoading: boolean
    user?: LoggedInUser
    viewMode: 'grid' | 'list' | 'map'
    setViewMode: (mode: 'grid' | 'list' | 'map') => void
}

export const QuestSpecies = ({
    questData,
    isOwner,
    token,
    share,
    detailedProgress,
    aggregatedProgress,
    taxa,
    mappings,
    isTaxaLoading,
    user,
    viewMode,
}: QuestSpeciesProps) => {
    const taxaWithProgress = useTaxaWithProgress(
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress
    )
    // Use the hooks from useQuest
    const { handleProgressUpdate, getAvatarOverlay } = useSpeciesProgress({
        mappings,
        detailedProgress,
        aggregatedProgress,
        taxa,
    })

    const { canInteract } = useSpeciesActions({
        isOwner,
        token,
        questData,
        user,
        share,
    })

    // Create wrapper functions for the hook functions
    const handleProgressUpdateWrapper = useCallback(
        async (taxon: TaxonWithProgress) => {
            if (!taxon.mapping) return
            await handleProgressUpdate(
                taxon.mapping,
                isOwner,
                user,
                share,
                questData,
                token
            )
        },
        [handleProgressUpdate, isOwner, user, share, questData, token]
    )

    const getAvatarOverlayWrapper = useCallback(
        (taxon: TaxonWithProgress) => {
            return getAvatarOverlay(taxon.recentEntries, questData.mode)
        },
        [getAvatarOverlay, questData.mode]
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
                        isOwner={isOwner}
                        user={user}
                        share={share}
                        token={token}
                        questStatus={questData.status}
                        questMode={questData.mode}
                        onClick={async () => {
                            await handleProgressUpdateWrapper(taxon)
                        }}
                        canInteract={canInteract}
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

    // Extract skeleton rendering
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

    // Extract species card rendering
    const renderSpeciesCard = useCallback(
        (taxon: TaxonWithProgress) => {
            return (
                <motion.div
                    key={taxon.id}
                    className="relative"
                    layout
                    layoutId={`species-${taxon.id}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                        layout: {
                            duration: 0.4,
                            type: 'spring',
                            damping: 25,
                            stiffness: 200,
                        },
                        default: { duration: 0.3 },
                    }}
                >
                    <SpeciesCardWithObservations
                        species={taxon}
                        questData={questData}
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
        <div>
            {/* View Content */}
            {viewMode === 'grid' && (
                <div className="space-y-8">
                    {/* Combined section for all species */}
                    <div>
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 auto-rows-fr"
                            layout
                        >
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
                        </motion.div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <QuestListView
                    taxaWithProgress={taxaWithProgress}
                    questData={questData}
                    isOwner={isOwner}
                    token={token}
                    share={share}
                    user={user}
                    detailedProgress={detailedProgress}
                />
            )}

            {viewMode === 'map' && taxa && mappings && (
                <QuestMapView
                    className="h-96 w-full rounded-lg border"
                    questData={questData}
                    taxa={taxa}
                    mappings={mappings}
                />
            )}
        </div>
    )
}
