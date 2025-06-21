'use client'

import React, { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { type INatTaxon } from '../../../shared/types/iNatTypes'
import getKingdomIcon from '@/components/search/getKingdomIcon'
import titleCase from '@/components/search/titleCase'
import { motion, AnimatePresence } from 'motion/react'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
    viewMode?: 'list' | 'grid'
    isSelectionMode?: boolean
    isSelectable?: boolean
}

export function SpeciesCard({ species, className, viewMode, isSelectable = true }: SpeciesCardProps) {

    const { isSelectionMode, selectedIds, addIdToSelection, removeIdFromSelection } = useSelectionContext()
    const cardRef = useRef<HTMLDivElement>(null)
    const isSelected = selectedIds.includes(species.id.toString())

    const [isFullScreen, setIsFullScreen] = React.useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (viewMode !== 'list' && !isSelectionMode) {
            // toggleFullScreen()
        } else if (viewMode !== 'list' && isSelectionMode && isSelectable === true) {
            selectCard()
        }

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
            <SpeciesListItem species={species} className={className} cardRef={cardRef} isSelected={isSelected}
                             handleClick={handleClick} />
        )
    }

    // --- Default (Grid) View Rendering ---
    return (
        <SpeciesGridItem species={species} className={className} cardRef={cardRef} isSelected={isSelected}
                         isSelectable={isSelectable}
                         handleClick={handleClick} />
    )
}

function SpeciesGridItem({ species, className, cardRef, isSelected, isSelectable = true, handleClick }: {
    species: INatTaxon,
    className?: string,
    cardRef: React.RefObject<HTMLDivElement | null>,
    isSelected: boolean,
    handleClick: (e: React.MouseEvent) => void
    isSelectable?: boolean
}) {
    return (<AnimatePresence mode='wait'>
        <motion.div
            key={species.id} // Keep this key for motion
            layout
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
                layout: { duration: 0.4, type: 'spring', damping: 20, stiffness: 200 },
                default: { duration: 0.3 },
            }}
            // whileHover= { {scale: 1.05, rotate: 1 }}
            className={cn(
                'w-full',
                'cursor-pointer rounded-lg overflow-hidden',
                isSelected && isSelectable && 'ring-2 ring-blue-500',
                // fullScreenTailwindClasses,
                className,
            )}
            onClick={handleClick}
            ref={cardRef}
        >
            <Card
                className={cn(
                    'transition-all duration-200 h-full w-full py-0 gap-0 flex flex-col',
                    isSelected && 'ring-2 ring-blue-500',
                )}
            >
                {species.default_photo && (
                    <CardContent className='m-0 p-0 flex-shrink-0'>
                        <img
                            src={species.default_photo.medium_url}
                            alt={species.name}
                            className='w-full object-cover rounded-t-xs'
                            style={{ aspectRatio: '1/1' }}
                        />
                    </CardContent>
                )}
                <CardContent className={cn(
                    'p-4 flex-grow',
                    // isFullScreen && 'overflow-y-auto',
                )}>
                    <div className='space-y-2'>
                        <div className='font-semibold text-lg'>
                            {titleCase(species.preferred_common_name) || species.name}
                        </div>
                        {species.preferred_common_name && (
                            <div className='text-sm text-muted-foreground italic'>
                                {species.name}
                            </div>
                        )}
                        <div className='flex gap-2 flex-wrap'>
                            {species.iconic_taxon_name && (
                                <Badge variant='default' className='text-xs'>
                                    {getKingdomIcon(species.iconic_taxon_name)}{' '}
                                    {species.iconic_taxon_name}
                                </Badge>
                            )}
                            {species.rank && (
                                <Badge variant='neutral' className='text-xs capitalize'>
                                    {species.rank}
                                </Badge>
                            )}
                        </div>
                        <div>
                            <div className='text-xs text-muted-foreground'>
                                {species.observations_count} observations
                            </div>
                        </div>
                        {species.wikipedia_url && (
                            <div className='flex items-center gap-1 text-xs text-blue-600'>
                                <ExternalLink className='h-3 w-3' />
                                <a
                                    href={species.wikipedia_url}
                                    // onClick={(e) => handleInteractiveClick(e, 'Wikipedia')}
                                >
                                    Wikipedia
                                </a>
                            </div>
                        )}
                        {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}

                    </div>
                </CardContent>
            </Card>
        </motion.div>
    </AnimatePresence>)
}

function SpeciesListItem({ species, className, cardRef, isSelected, handleClick }: {
    species: INatTaxon,
    className?: string,
    cardRef: React.RefObject<HTMLDivElement | null>
}) {
    return (<motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
            default: { duration: 0.5 },
        }}
        className={cn(
            'flex items-center gap-4 p-2 rounded-md transition-all duration-200 hover:bg-gray-100',
            isSelected && 'ring-2 ring-blue-500 bg-blue-50',
            className,
        )}
        onClick={handleClick}
        ref={cardRef}
    >
        {species.default_photo && (
            <img
                src={species.default_photo.square_url || species.default_photo.medium_url}
                alt={species.name}
                className='h-16 w-16 object-cover rounded-sm flex-shrink-0'
            />
        )}
        <div className='flex-grow'>
            <div className='font-semibold text-base'>
                {titleCase(species.preferred_common_name) || species.name}
            </div>
            {species.preferred_common_name && (
                <div className='text-sm text-muted-foreground italic'>
                    {species.name}
                </div>
            )}
            <div className='flex gap-2 items-center mt-1'>
                {species.iconic_taxon_name && (
                    <Badge variant='default' className='text-xs'>
                        {getKingdomIcon(species.iconic_taxon_name)} {species.iconic_taxon_name}
                    </Badge>
                )}
                {species.rank && (
                    <Badge variant='neutral' className='text-xs capitalize'>
                        {species.rank}
                    </Badge>
                )}
            </div>
        </div>
        <div className='flex flex-col items-end flex-shrink-0'>
            <div className='text-xs text-muted-foreground'>
                {species.observations_count} obs.
            </div>
            {species.wikipedia_url && (
                <a
                    href={species.wikipedia_url}
                    onClick={(e) => handleInteractiveClick(e, 'Wikipedia')}
                    className='flex items-center gap-1 text-xs text-blue-600 hover:underline'
                >
                    <ExternalLink className='h-3 w-3' />
                    Wikipedia
                </a>
            )}
            {isSelected && <div className='text-xs text-blue-600 font-medium mt-1'>✓ Selected</div>}
        </div>
    </motion.div>)
}