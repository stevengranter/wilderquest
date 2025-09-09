import { useCallback, useRef } from 'react'
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


// Use QuestMapping instead of defining TaxonMapping
type TaxonMapping = QuestMapping

type TaxonWithProgress = INatTaxon & {
    mapping: TaxonMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

type QuestSpeciesProps = {
    taxaWithProgress: TaxonWithProgress[]
    questData: ClientQuest
    isOwner: boolean
    token: string | undefined
    share: Share | undefined
    detailedProgress: DetailedProgress[] | undefined
    aggregatedProgress: AggregatedProgress[] | undefined
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    fetchNextTaxaPage: () => void
    taxa: INatTaxon[] | undefined
    mappings: TaxonMapping[] | undefined
    updateStatus: (status: QuestStatus) => void
    isTaxaLoading: boolean
    user?: LoggedInUser
    viewMode: 'grid' | 'list' | 'map'
    setViewMode: (mode: 'grid' | 'list' | 'map') => void
}

export const QuestSpecies = ({
    taxaWithProgress,
    questData,
    isOwner,
    token,
    share,
    detailedProgress,
    aggregatedProgress,
    isTaxaFetchingNextPage,
    taxaHasNextPage,
    fetchNextTaxaPage,
    taxa,
    mappings,
    isTaxaLoading,
    user,
    viewMode,
}: QuestSpeciesProps) => {

    const observer = useRef<IntersectionObserver | null>(null)

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

    // Load more species from server when available
    const loadMoreSpecies = useCallback(async () => {
        if (taxaHasNextPage && !isTaxaFetchingNextPage) {
            fetchNextTaxaPage()
        }
    }, [taxaHasNextPage, isTaxaFetchingNextPage, fetchNextTaxaPage])

    const lastTaxonElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreSpecies()
                }
            })
            if (node) observer.current.observe(node)
        },
        [loadMoreSpecies]
    )

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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }} // Stagger animation
                >
                    <SpeciesCardSkeleton phase={phase} />
                </motion.div>
            ))
        },
        [mappings?.length]
    )

    // Extract species card rendering
    const renderSpeciesCard = useCallback(
        (taxon: TaxonWithProgress, index?: number, isLast?: boolean) => {
            return (
                <motion.div
                    key={taxon.id}
                    ref={isLast ? lastTaxonElementRef : undefined}
                    className="relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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
        [
            questData,
            getAvatarOverlayWrapper,
            renderActionButton,
            lastTaxonElementRef,
        ]
    )


    return (
        <div>
            {/* View Content */}
            {viewMode === 'grid' && (
                <div className="space-y-8">
                    {/* Combined section for all species */}
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 auto-rows-fr">
                            <AnimatePresence mode="popLayout">
                                {isTaxaLoading
                                    ? renderSkeletons(
                                          'all-species',
                                          mappings?.length || 6
                                      )
                                    : taxaWithProgress.map(
                                          (taxon, index, arr) =>
                                              renderSpeciesCard(
                                                  taxon,
                                                  index,
                                                  index === arr.length - 1
                                              )
                                      )}
                            </AnimatePresence>

                            {/* Loading indicator for server-side pagination */}
                            {isTaxaFetchingNextPage && (
                                <motion.div
                                    className="col-span-full flex justify-center py-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                        Loading more species...
                                    </div>
                                </motion.div>
                            )}
                        </div>
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
