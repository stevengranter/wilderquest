'use client'

import React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppContext } from '@/contexts/app-context'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { type INatTaxon } from '../../../shared/types/iNatTypes'
import getKingdomIcon from '@/components/search/getKingdomIcon'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
}

export function SpeciesCard({ species, className }: SpeciesCardProps) {
    const { selectedIds, addToSelection, removeFromSelection } = useAppContext()

    const isSelected = selectedIds.has(species.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const id = species.id.toString()

        if (isSelected) {
            removeFromSelection([id])
        } else {
            addToSelection([id])
        }
    }



    return (
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                className,
            )}
            onClick={handleClick}
        >
            <CardContent className='p-4'>
                <div className='space-y-2'>
                    {/* Photo */}

                    {species.default_photo && (
                        <img
                            src={species.default_photo.medium_url}
                            alt={species.name}
                            className='aspect-square w-full object-cover' />)}

                    {/* Main name */}
                    <div className='font-semibold text-lg'>{species.preferred_common_name || species.name}</div>

                    {/* Scientific name if different */}
                    {species.preferred_common_name &&
                        <div className='text-sm text-muted-foreground italic'>{species.name}</div>}

                    {/* Kingdom and rank badges */}
                    <div className='flex gap-2 flex-wrap'>
                        {species.iconic_taxon_name && (
                            <Badge variant='secondary' className='text-xs'>
                                {getKingdomIcon(species.iconic_taxon_name)} {species.iconic_taxon_name}
                            </Badge>
                        )}
                        {species.rank && (
                            <Badge variant='outline' className='text-xs capitalize'>
                                {species.rank}
                            </Badge>
                        )}
                    </div>

                    {/* Wikipedia link */}
                    {species.wikipedia_url && (
                        <div className='flex items-center gap-1 text-xs text-blue-600'>
                            <ExternalLink className='h-3 w-3' />
                            <span>Wikipedia</span>
                        </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                </div>
            </CardContent>
        </Card>
    )
}
