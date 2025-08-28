import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Grid, List, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ClientQuest, SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { SpeciesCardSkeleton } from '@/features/quests/components/SpeciesCard'
import { QuestListView } from '../../QuestListView'
import { QuestMapView } from '../../QuestMapView'
// Import QuestMapping type
import { AggregatedProgress, DetailedProgress, QuestMapping, QuestStatus, Share } from '@/features/quests/types'
import { INatTaxon } from '@shared/types/iNatTypes'
import { LoggedInUser } from '@shared/types/authTypes'
import { useSpeciesActions, useSpeciesProgress } from '@/hooks/useQuest'

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
    updateStatus,
    isTaxaLoading,
    user,
}: QuestSpeciesProps) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')

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

    const observer = useRef<IntersectionObserver | null>(null)

    const lastTaxonElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isTaxaFetchingNextPage) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && taxaHasNextPage) {
                    fetchNextTaxaPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isTaxaFetchingNextPage, taxaHasNextPage, fetchNextTaxaPage]
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
            if (!canInteract(questData.status) || !taxon.mapping) {
                return null
            }

            // Check if current user has already marked this species as found
            const currentUserDisplayName = isOwner
                ? user?.username
                : share?.guest_name

            const userHasFound = detailedProgress?.some(
                (progress) =>
                    progress.mapping_id === taxon.mapping?.id &&
                    progress.display_name === currentUserDisplayName
            )

            return (
                <div className="p-2">
                    <Button
                        className="w-full shadow-0 border-1"
                        size="sm"
                        variant="neutral"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleProgressUpdateWrapper(taxon)
                        }}
                    >
                        {userHasFound ? 'Mark as unfound' : 'Found'}
                    </Button>
                </div>
            )
        },
        [
            canInteract,
            questData.status,
            handleProgressUpdateWrapper,
            isOwner,
            user?.username,
            share?.guest_name,
            detailedProgress,
        ]
    )

    // Extract skeleton rendering
    const renderSkeletons = useCallback(
        (keyPrefix: string, count: number = 6) => {
            return Array.from({
                length: Math.min(mappings?.length || count, count),
            }).map((_, i) => (
                <motion.div
                    key={`skeleton-${keyPrefix}-${i}`}
                    className="relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <SpeciesCardSkeleton />
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
                    ref={isLast ? lastTaxonElementRef : null}
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

    // Extract section rendering
    const renderSpeciesSection = useCallback(
        (
            title: string,
            taxa: TaxonWithProgress[],
            keyPrefix: string,
            enableInfiniteScroll = false
        ) => {
            return (
                <div>
                    <h3 className="text-lg font-semibold mb-3">
                        {title} ({isTaxaLoading ? '...' : taxa.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6 auto-rows-fr">
                        <AnimatePresence mode="popLayout">
                            {isTaxaLoading
                                ? renderSkeletons(keyPrefix)
                                : taxa.map((taxon, index, arr) =>
                                      renderSpeciesCard(
                                          taxon,
                                          index,
                                          enableInfiniteScroll &&
                                              index === arr.length - 1
                                      )
                                  )}
                        </AnimatePresence>
                    </div>
                </div>
            )
        },
        [isTaxaLoading, renderSkeletons, renderSpeciesCard]
    )

    const notFoundTaxa = taxaWithProgress.filter((t) => !t.isFound)
    const foundTaxa = taxaWithProgress.filter((t) => t.isFound)

    return (
        <div className="mt-8">
            {/* View Mode Controls */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                    Species ({mappings?.length ?? 0})
                </h2>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value: 'grid' | 'list' | 'map') =>
                        value && setViewMode(value)
                    }
                    className="border-0 rounded-lg"
                >
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <Grid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="map" aria-label="Map view">
                        <MapIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* View Content */}
            {viewMode === 'grid' && (
                <div className="space-y-8">
                    {renderSpeciesSection(
                        'Not Found',
                        notFoundTaxa,
                        'not-found',
                        true
                    )}
                    {renderSpeciesSection('Found', foundTaxa, 'found')}
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
                    aggregatedProgress={aggregatedProgress}
                    updateStatus={updateStatus}
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
