'use client'

import type React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppContext } from '@/contexts/app-context'
import { cn } from '@/lib/utils'
import { Calendar, MapPin, Camera } from 'lucide-react'

interface ObservationCardProps {
    observation: any
    className?: string
}

export function ObservationCard({ observation, className }: ObservationCardProps) {
    const { selectedIds, addToSelection, removeFromSelection } = useAppContext()

    const isSelected = selectedIds.has(observation.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const id = observation.id.toString()

        if (isSelected) {
            removeFromSelection([id])
        } else {
            addToSelection([id])
        }
    }

    const hasPhotos = observation.photos && observation.photos.length > 0

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
                    {/* Species name */}
                    <div className='font-semibold text-lg'>{observation.species_guess || 'Unknown Species'}</div>

                    {/* Date observed */}
                    {observation.observed_on && (
                        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>{new Date(observation.observed_on).toLocaleDateString()}</span>
                        </div>
                    )}

                    {/* Location */}
                    {observation.place_guess && (
                        <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <MapPin className='h-3 w-3' />
                            <span>{observation.place_guess}</span>
                        </div>
                    )}

                    {/* Photo indicator */}
                    <div className='flex gap-2 flex-wrap'>
                        <Badge variant={hasPhotos ? 'default' : 'secondary'} className='text-xs'>
                            <Camera className='h-3 w-3 mr-1' />
                            {hasPhotos ? `${observation.photos.length} photo(s)` : 'No photos'}
                        </Badge>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                </div>
            </CardContent>
        </Card>
    )
}
