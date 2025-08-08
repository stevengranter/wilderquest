'use client'

import { type INatTaxon } from '@shared/types/iNatTypes'
import { ExternalLink } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useRef } from 'react'
import getKingdomIcon from '@/components/search/getKingdomIcon'
import titleCase from '@/components/search/titleCase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import { cn } from '@/lib/utils'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
    viewMode?: 'list' | 'grid'
    isSelectionMode?: boolean
    isSelectable?: boolean
}

export function SpeciesCard({
    species,
    className,
    viewMode,
    isSelectable = true,
}: SpeciesCardProps) {
    const {
        isSelectionMode,
        selectedIds,
        addIdToSelection,
        removeIdFromSelection,
    } = useSelectionContext()
    const cardRef = useRef<HTMLDivElement>(null)
    const isSelected = selectedIds.includes(species.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        // Only prevent default and handle click if we're in selection mode
        if (isSelectionMode) {
            e.preventDefault()
            if (isSelectable === true) {
                selectCard()
            }
        }
        // If not in selection mode, let the event bubble up (for DialogTrigger, etc.)
    }

    const selectCard = () => {
        const id = species.id.toString()

        if (isSelected) {
            removeIdFromSelection(id)
        } else {
            addIdToSelection(id) // Corrected from addIdFromSelection
        }
    }
    const handleInteractiveClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation()
        console.log(`${action} clicked`)
    }

    // --- List View Rendering (no changes needed here for zoom issue) ---
    if (viewMode === 'list') {
        return (
            <SpeciesListItem
                species={species}
                className={className}
                cardRef={cardRef}
                isSelected={isSelected}
                handleClick={handleClick}
            />
        )
    }

    // --- Default (Grid) View Rendering ---
    return (
        <SpeciesGridItem
            species={species}
            className={className}
            cardRef={cardRef}
            isSelected={isSelected}
            isSelectable={isSelectable}
            handleClick={handleClick}
        />
    )
}

function SpeciesGridItem({
    species,
    className,
    cardRef,
    isSelected,
    isSelectable = true,
    handleClick,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    isSelected: boolean
    handleClick: (e: React.MouseEvent) => void
    isSelectable?: boolean
}) {
    const KingdomIcon = getKingdomIcon(species.iconic_taxon_name)
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={species.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                    layout: {
                        duration: 0.4,
                        type: 'spring',
                        damping: 20,
                        stiffness: 200,
                    },
                    default: { duration: 0.3 },
                }}
                whileHover={{
                    scale: 1.04,
                    // rotateZ: 5,
                    y: -2,
                    transition: { duration: 0.2, type: 'spring', damping: 15 },
                }}
                whileTap={{ scale: 0.98 }}
                className={cn('w-full cursor-pointer', className)}
                onClick={handleClick}
                ref={cardRef}
                // style={{
                //     aspectRatio: '2.5/3.5', // Trading card proportions
                // }}
            >
                <Card
                    className={cn(
                        'aspect-2.5/3.5 overflow-hidden',
                        'shadow-0 py-0 gap-0',
                        isSelected && 'ring-2 ring-blue-500 shadow-blue-200/50',
                        'hover:shadow-shadow transition-shadow duration-500',
                    )}
                >
                    <CardHeader className="gap-0 justify-start pt-2 pb-1 relative">
                        {species.preferred_common_name && (
                            <h3 className="sm:text-md md:text-lg lg:text-xxl">
                                {titleCase(species.preferred_common_name)}
                            </h3>
                        )}




                    </CardHeader>
                    <CardContent className="relative px-0 mx-5">
                        <div className="absolute -top-3 -right-3">
                        {species.iconic_taxon_name && (
                            <div className="bg-main rounded-full text-bg-main-foreground p-2">
                           <KingdomIcon size={20} />
                                </div>
                        )}
                        </div>

                        {species.default_photo ? (
                            <>
                                <img
                                    src={species.default_photo.medium_url}
                                    alt={species.name}
                                    className="w-full h-full aspect-square object-cover border-2 rounded-sm"
                                />
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-gray-400 text-xs text-center px-2">
                                    No image
                                </div>
                            </div>
                        )}




                    </CardContent>

                    {/* Content Footer - Flexible height below square image */}
                    <CardFooter className="min-h-[120px] flex flex-col justify-start">
                        {/* Species Names */}

                        <div className="space-y-1 justify-start self-end mt-1">
                            {species.preferred_common_name && (
                                <p className="text-[11px] text-muted-foreground italic leading-tight line-clamp-1">
                                    {species.name}
                                </p>
                            )}
                            {/*<h3 className="font-bold text-sm leading-tight line-clamp-2">*/}
                            {/*    {titleCase(species.preferred_common_name) ||*/}
                            {/*        species.name}*/}
                            {/*</h3>*/}

                        </div>

                        {/* Stats and Badges Row */}
                        <div className="flex items-center justify-between mt-auto">
                            {/* DISABLED: ALl records are Species rank*/}
                            {/*<div className="flex items-center gap-1">*/}
                            {/*    {species.rank && (*/}
                            {/*        <Badge*/}
                            {/*            variant="neutral"*/}
                            {/*            className="text-[9px] px-1.5 py-0.5 h-auto capitalize"*/}
                            {/*        >*/}
                            {/*            {species.rank}*/}
                            {/*        </Badge>*/}
                            {/*    )}*/}
                            {/*</div>*/}

                            <div className="text-[10px] text-muted-foreground text-right">
                                <div>
                                    {species.observations_count?.toLocaleString() ||
                                        '0'}{' '}
                                    obs
                                </div>
                            </div>
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                            <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-blue-500 text-white text-[10px] font-medium px-2 py-0.5 rounded text-center">
                                    ✓ Selected
                                </div>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}

function SpeciesListItem({
    species,
    className,
    cardRef,
    isSelected,
    handleClick,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    isSelected: boolean
    handleClick: (e: React.MouseEvent) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
                default: { duration: 0.5 },
            }}
            className={cn(
                'flex items-center gap-4 p-2 rounded-md transition-all duration-200 hover:bg-gray-100',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                className
            )}
            onClick={handleClick}
            ref={cardRef}
        >
            {species.default_photo && (
                <img
                    src={
                        species.default_photo.square_url ||
                        species.default_photo.medium_url
                    }
                    alt={species.name}
                    className="h-16 w-16 object-cover rounded-sm flex-shrink-0"
                />
            )}
            <div className="flex-grow">
                <div className="font-semibold text-base">
                    {titleCase(species.preferred_common_name) || species.name}
                </div>
                {species.preferred_common_name && (
                    <div className="text-sm text-muted-foreground italic">
                        {species.name}
                    </div>
                )}
                <div className="flex gap-2 items-center mt-1">
                    {species.iconic_taxon_name && (
                        <Badge variant="default" className="text-xs">
                            {getKingdomIcon(species.iconic_taxon_name)}{' '}
                            {species.iconic_taxon_name}
                        </Badge>
                    )}
                    {species.rank && (
                        <Badge variant="neutral" className="text-xs capitalize">
                            {species.rank}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
                <div className="text-xs text-muted-foreground">
                    {species.observations_count} obs.
                </div>
                {species.wikipedia_url && (
                    <a
                        href={species.wikipedia_url}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Wikipedia
                    </a>
                )}
                {isSelected && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                        ✓ Selected
                    </div>
                )}
            </div>
        </motion.div>
    )
}
