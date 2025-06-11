'use client'

import React, { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Calendar, MapPin, Camera } from 'lucide-react'
import { type INatObservation } from '../../../shared/types/iNatTypes'
import titleCase from '@/components/search/titleCase'
import { useSearchContext } from '@/contexts/search/SearchContext'

interface ObservationCardProps {
    observation: INatObservation
    className?: string
}

export function ObservationCard({ observation, className }: ObservationCardProps) {
    const { selectedIds, removeIdFromSelection, addIdToSelection } = useSearchContext()

    const isSelected = selectedIds.includes(Number(observation.id))

    // --- FIX 1: Safely get the photo URL using optional chaining ---
    // This will be undefined if `photos` is missing or the array is empty, without causing an error.
    const imageUrl = observation.photos?.[0]?.url?.replace('square.jpg', 'medium.jpg')

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const id = Number(observation.id)

        if (isSelected) {
            removeIdFromSelection(id)
        } else {
            addIdToSelection(id)
        }
    }


    return (
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                'p-4 rotate-2 aspec-ratio-[3.5/4/2]',
                className,
            )}
            onClick={handleClick}
        >
            <CardContent className='m-0 p-0'>
                {/* --- FIX 2: Use a single ternary for cleaner and more robust rendering --- */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={observation.species_guess ?? 'Observation photo'}
                        className='aspect-square w-full object-cover'
                    />
                ) : (
                    <div
                        className='flex items-center justify-center aspect-square w-full object-cover rounded-t-md bg-gray-100'>
                        <Camera className='h-10 w-10 text-gray-300' />
                    </div>
                )}
            </CardContent>
            <CardContent className='p-4'>
                <div className='space-y-2'>
                    {/* Species name */}
                    <div
                        className='font-semibold text-lg'>{titleCase(observation.species_guess || 'Unknown Species')}</div>

                    {/* Date observed */}
                    {/* Using observed_on_string is often more reliable than observed_on */}
                    {observation.observed_on && (
                        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>{observation.observed_on}</span>
                        </div>
                    )}

                    {/* Location */}
                    {observation.place_guess && (
                        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <MapPin className='h-3 w-3' />
                            <span>{observation.place_guess}</span>
                        </div>
                    )}

                    {/*Photo indicator*/}
                    <div className='flex gap-2 flex-wrap'>
                        <Badge variant={imageUrl ? 'default' : 'neutral'} className='text-xs'>
                            <Camera className='h-3 w-3 mr-1' />
                            {imageUrl ? `${observation.photos.length} photo(s)` : 'No photos'}
                        </Badge>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                </div>
            </CardContent>
        </Card>
    )
}
