import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGroup } from 'motion/react'

import { SpeciesCardWithObservations } from '@/components/SpeciesCardWithObservations'
import { SpeciesCardSkeleton } from '@/components/SpeciesCard'
import { FoundButton } from '@/components/FoundButton'
import { INatTaxon } from '@shared/types/iNaturalist'
import { DetailedProgress, QuestMapping } from '@/types/questTypes'

type TaxonWithProgress = INatTaxon & {
    mapping: QuestMapping | undefined
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

interface QuestSpeciesGridViewProps {
    taxaWithProgress: TaxonWithProgress[]
    isTaxaLoading: boolean
    mappings?: QuestMapping[]
    getAvatarOverlayWrapper: (taxon: TaxonWithProgress) => {
        username?: string
        isRegistered?: boolean
        users?: Array<{
            username: string
            isRegistered?: boolean
        }>
        firstFinder?: string
    } | null
    getFoundButtonProps: (taxon: TaxonWithProgress) => {
        disabled?: boolean
        variant?: 'default' | 'neutral'
        children: string
        onClick?: (e: React.MouseEvent) => void | Promise<void>
        fullWidth?: boolean
    } | null
}

export const QuestSpeciesGridView = ({
    taxaWithProgress,
    isTaxaLoading,
    mappings,
    getAvatarOverlayWrapper,
    getFoundButtonProps,
}: QuestSpeciesGridViewProps) => {
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
            const buttonProps = getFoundButtonProps(taxon)

            return (
                <motion.div key={taxon.id} className="relative">
                    <SpeciesCardWithObservations
                        species={taxon}
                        found={taxon.progressCount > 0}
                        avatarOverlay={getAvatarOverlayWrapper(taxon)}
                        actionArea={
                            buttonProps ? (
                                <div className="p-2">
                                    <FoundButton {...buttonProps} />
                                </div>
                            ) : null
                        }
                    />
                </motion.div>
            )
        },
        [getAvatarOverlayWrapper, getFoundButtonProps]
    )

    return (
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
    )
}
