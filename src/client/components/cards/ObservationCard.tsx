'use client'

import type React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Calendar, Camera, MapPin } from 'lucide-react'
import { type INatObservation } from '../../../shared/types/iNatTypes'
import titleCase from '@/components/search/titleCase'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'

interface ObservationCardProps {
    observation: INatObservation
    className?: string
    viewMode?: 'list' | 'grid' // Added viewMode prop
}

export function ObservationCard({
    observation,
    className,
    viewMode,
}: ObservationCardProps) {
    const {
        isSelectionMode,
        selectedIds,
        addIdToSelection,
        removeIdFromSelection,
    } = useSelectionContext()

    const isSelected = selectedIds.includes(observation.id.toString())

    const imageUrl = observation.photos?.[0]?.url?.replace(
        'square.jpg',
        'medium.jpg'
    )
    const squareImageUrl = observation.photos?.[0]?.url?.replace(
        'medium.jpg',
        'square.jpg'
    ) // For, list view

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        // instead of the, observation id, we want the taxon id, stored in taxon.id
        const id = observation?.taxon?.id.toString()

        if (isSelected) {
            removeIdFromSelection(id)
        } else {
            addIdToSelection(id)
        }
    }

    // --- List View Rendering ---
    if (viewMode === 'list') {
        return (
            <div
                className={cn(
                    'flex items-center gap-4 p-3 rounded-md transition-all duration-200 hover:bg-gray-100',
                    isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                    className
                )}
                onClick={handleClick}
            >
                {squareImageUrl ? (
                    <img
                        src={squareImageUrl}
                        alt={observation.species_guess ?? 'Observation photo'}
                        className="'-16 w-16 object-cover rounded-md flex-shrink-0"'                    />
                ) : (
                    <div className="h-16 w-16 flex items-center justify-center rounded-md bg-gray-100 flex-shrink-0">
                        <Camera className="h-8 w-8 text-gray-300" />
                    </div>
                )}
                <div className="flex-grow">
                    <div className="font-semibold text-base">
                        {titleCase(
                            observation.species_guess || 'Unknown Species'
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{observation.observed_on || 'Date Unknown'}</span>
                    </div>
                    {observation.place_guess && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{observation.place_guess}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                    <Badge
                        variant={imageUrl ? 'default' : 'neutral'}
                        className="text-xs"
                    >
                        <Camera className="h-3 w-3 mr-1" />
                        {imageUrl
                            ? `${observation.photos.length} photo(s)`
                            : 'No photos'}
                    </Badge>
                    {isSelected && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                            ✓ Selected
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // --- Default (Grid) View Rendering ---
    return (
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                // Removed 'rotate-2' and 'aspect-ratio' for better control in both modes,
                // you can add them back if you only want them in grid mode.
                'p-4',
                className
            )}
            onClick={handleClick}
        >
            <CardContent className="m-0 p-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={observation.species_guess ?? 'Observation photo'}
                        className="aspect-square w-full object-cover rounded-t-md" // Added rounded-t-md for top corners
                    />
                ) : (
                    <div className="flex items-center justify-center aspect-square w-full object-cover rounded-t-md bg-gray-100">
                        <Camera className="h-10 w-10 text-gray-300" />
                    </div>
                )}
            </CardContent>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {/* Species name */}
                    <div className="font-semibold text-lg">
                        {titleCase(
                            observation.species_guess || 'Unknown Species'
                        )}
                    </div>

                    {/* Date observed */}
                    {observation.observed_on && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{observation.observed_on}</span>
                        </div>
                    )}

                    {/* Location */}
                    {observation.place_guess && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{observation.place_guess}</span>
                        </div>
                    )}

                    {/* Photo indicator */}
                    <div className="flex gap-2 flex-wrap">
                        <Badge
                            variant={imageUrl ? 'default' : 'neutral'}
                            className="text-xs"
                        >
                            <Camera className="h-3 w-3 mr-1" />
                            {imageUrl
                                ? `${observation.photos.length} photo(s)`
                                : 'No photos'}
                        </Badge>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="text-xs text-blue-600 font-medium">
                            ✓ Selected
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
