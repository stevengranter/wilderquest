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
import { useSearchContext } from '@/contexts/search/SearchContext'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
    viewMode?: 'list' | 'grid'
}

export function SpeciesCard({ species, className, viewMode }: SpeciesCardProps) {


    const { selectedIds, addIdToSelection, removeIdFromSelection } = useSearchContext()
    const cardRef = useRef<HTMLDivElement>(null)
    const isSelected = selectedIds.includes(species.id.toString())

    const [isFullScreen, setIsFullScreen] = React.useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        // It's usually not recommended to mix click handlers and drag handlers on the same element.
        // If you want the card to be clickable AND draggable, you might need to differentiate
        // between a drag event and a click event, or wrap the draggable in another element
        // that handles clicks. For now, I'm assuming you want click to primarily select/toggle fullscreen
        // when *not* dragging.
        if (viewMode !== 'list') {
            toggleFullScreen()
        }
        selectCard()
    }

    const selectCard = () => {
        const id = species.id.toString()

        if (isSelected) {
            removeIdFromSelection(id)
        } else {
            addIdToSelection(id) // Corrected from addIdFromSelection
        }
    }

    const toggleFullScreen = () => {
        setIsFullScreen(prev => !prev)
        if (!isFullScreen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
    }

    const handleInteractiveClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation()
        console.log(`${action} clicked`)
    }

    // Tailwind classes for the *fixed* position when full screen.
    const fullScreenTailwindClasses = isFullScreen
        ? `
            fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[90vw] h-[90vh] max-w-none max-h-none
            z-50 p-4 bg-white/95 backdrop-blur-sm
            shadow-2xl rounded-lg
        `
        : `
            relative
            hover:shadow-md
        `

    // --- List View Rendering (no changes needed here for zoom issue) ---
    if (viewMode === 'list') {
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
            </motion.div>
        )
    }

    // --- Default (Grid) View Rendering ---
    return (
        <AnimatePresence mode='wait'>

            <motion.div
                key={species.id} // Keep this key for motion
                layout
                initial={{ opacity: 0 }}
                animate={isFullScreen ? {
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                } : {
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                    layout: { duration: 0.4, type: 'spring', damping: 20, stiffness: 200 },
                    default: { duration: 0.3 },
                }}
                whileHover={!isFullScreen ? { scale: 1.05, rotate: 1 } : {}}
                className={cn(
                    'w-full aspect-square',
                    'cursor-pointer rounded-lg overflow-hidden',
                    isSelected && 'ring-2 ring-blue-500',
                    fullScreenTailwindClasses,
                    className,
                )}
                onClick={handleClick}
                ref={cardRef}
            >
                <Card
                    className={cn(
                        'transition-all duration-200 h-full w-full py-0 gap-0 flex flex-col',
                        isSelected && 'ring-2 ring-blue-500',
                        isFullScreen && 'shadow-none',
                    )}
                >
                    {species.default_photo && (
                        <CardContent className='m-0 p-0 flex-shrink-0'>
                            <img
                                src={species.default_photo.medium_url}
                                alt={species.name}
                                className='w-full object-cover rounded-t-xs'
                                style={isFullScreen ? {
                                    maxHeight: '40vh',
                                    objectFit: 'contain',
                                } : { aspectRatio: '1/1' }}
                            />
                        </CardContent>
                    )}
                    <CardContent className={cn(
                        'p-4 flex-grow',
                        isFullScreen && 'overflow-y-auto',
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
                                        onClick={(e) => handleInteractiveClick(e, 'Wikipedia')}
                                    >
                                        Wikipedia
                                    </a>
                                </div>
                            )}
                            {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                            {isFullScreen && (
                                <div className='mt-4 text-sm text-gray-700'>
                                    <p>This is some additional detail that appears when the card is zoomed in.
                                        This content will push the height and should trigger the scrollbar if the card's
                                        allocated height is exceeded.
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                                        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                                        culpa qui officia deserunt mollit anim id est laborum.</p>
                                    <p className='mt-2'>Another paragraph to ensure we have enough content to scroll.
                                        It's important to test with realistic content lengths.</p>
                                    <p className='mt-2'>Final paragraph of extra content. The key is to make sure that
                                        the scrollbar appears within this section, not cutting off the card itself.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}