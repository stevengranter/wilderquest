'use client'

import React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { type INatTaxon } from '../../../shared/types/iNatTypes'
import getKingdomIcon from '@/components/search/getKingdomIcon'
import titleCase from '@/components/search/titleCase'
import { motion } from 'motion/react'
import { useSearchContext } from '@/contexts/search/SearchContext'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
}

export function SpeciesCard({ species, className }: SpeciesCardProps) {
    const { selectedIds, addIdToSelection, removeIdFromSelection } = useSearchContext()

    const isSelected = selectedIds.includes(species.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const id = species.id.toString()

        if (isSelected) {
            removeIdFromSelection(id)
        } else {
            addIdToSelection(id)
        }
    }
    const handleInteractiveClick = (e: React.MouseEvent, action: string) => {
        // Prevent card selection when clicking interactive elements
        e.stopPropagation()
        console.log(`${action} clicked`)
    }



    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
                default: { duration: 0.5 },
                rotate: { type: 'spring', duration: 0.4 },
                scale: { type: 'spring', duration: 0.4 },
            }}
            whileHover={{ scale: 1.1, rotate: 2 }}
            // whileTap={isAlreadySelected ? {} : { scale: 0.95 }}
        >
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500',
                'py-0 gap-0',
                className,
            )}
            onClick={handleClick}
        >
            <CardContent className='m-0 p-0'>
                {species.default_photo && (
                    <img
                        src={species.default_photo.medium_url}
                        alt={species.name}
                        className='aspect-square w-full object-cover rounded-t-md' />)}

            </CardContent>
            <CardContent className='p-4'>
                <div className='space-y-2'>

                    {/* Main name */}
                    <div
                        className='font-semibold text-lg'>{titleCase(species.preferred_common_name) || species.name}</div>

                    {/* Scientific name if different */}
                    {species.preferred_common_name &&
                        <div className='text-sm text-muted-foreground italic'>{species.name}</div>}

                    {/* Kingdom and rank badges */}
                    <div className='flex gap-2 flex-wrap'>
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

                    <div>
                        <div className='text-xs text-muted-foreground'>
                            {species.observations_count} observations
                        </div>
                    </div>

                    {/* Wikipedia link */}
                    {species.wikipedia_url && (
                        <div className='flex items-center gap-1 text-xs text-blue-600'>
                            <ExternalLink
                                className='h-3 w-3'
                            />
                            <a
                                href={species.wikipedia_url}
                                onClick={(e) => handleInteractiveClick(e, 'Wikipedia')}
                            >Wikipedia</a>
                        </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                </div>
            </CardContent>
        </Card>
        </motion.div>
    )
}
