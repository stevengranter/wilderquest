import { cn } from '@/lib/utils'
import { MdOutlineLocationOn } from 'react-icons/md'
import { ProgressiveObservationImage } from './ProgressiveObservationImage'

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

export interface Observation {
    id: number
    photos: ObservationPhoto[]
    observed_on_string: string
    place_guess: string
    location?: [number, number] // lat, lng coordinates
    geojson?: {
        coordinates: [number, number] // lng, lat (GeoJSON format)
    }
    user: {
        login: string
    }
    searchRadius?: number // Track which radius this observation came from
}

interface ObservationCardProps {
    observation: Observation
    showRadiusBadges?: boolean
    onPhotoClick?: (observationIndex: number, photoIndex: number) => void
    observationIndex?: number
    variant?: 'grid' | 'map' | 'list'
    className?: string
}

export function ObservationCard({
    observation: obs,
    showRadiusBadges = true,
    onPhotoClick,
    observationIndex = 0,
    variant = 'grid',
    className = '',
}: ObservationCardProps) {
    const handleClick = () => {
        if (onPhotoClick && obs.photos.length > 0) {
            onPhotoClick(observationIndex, 0)
        }
    }

    const isClickable = onPhotoClick && obs.photos.length > 0

    if (variant === 'map') {
        return (
            <div className={cn('max-w-xs', className)}>
                {obs.photos.length > 0 && (
                    <div
                        className={cn(
                            'cursor-pointer',
                            isClickable && 'hover:opacity-80 transition-opacity'
                        )}
                        onClick={handleClick}
                    >
                        <ProgressiveObservationImage
                            photo={obs.photos[0]}
                            className="w-full h-32 bg-gray-100 rounded mb-2"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                        Observed by {obs.user.login}
                    </p>
                    {obs.searchRadius && showRadiusBadges && (
                        <span
                            className={`text-xs px-1.5 py-0.5 rounded-full text-white ${
                                obs.searchRadius === 20
                                    ? 'bg-blue-500'
                                    : obs.searchRadius === 100
                                      ? 'bg-green-500'
                                      : 'bg-purple-500'
                            }`}
                        >
                            {obs.searchRadius}km
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    {obs.observed_on_string}
                </p>
                {obs.place_guess && (
                    <div className="flex items-center gap-1 mt-1">
                        <MdOutlineLocationOn className="text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                            {obs.place_guess}
                        </p>
                    </div>
                )}
            </div>
        )
    }

    if (variant === 'list') {
        return (
            <div className={cn('flex items-center gap-4', className)}>
                {obs.photos.length > 0 && (
                    <ProgressiveObservationImage
                        photo={obs.photos[0]}
                        className="w-16 h-16 rounded-md flex-shrink-0"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                            Observed by {obs.user.login}
                        </p>
                        {obs.searchRadius && showRadiusBadges && (
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${
                                    obs.searchRadius === 20
                                        ? 'bg-blue-500'
                                        : obs.searchRadius === 100
                                          ? 'bg-green-500'
                                          : 'bg-purple-500'
                                }`}
                            >
                                {obs.searchRadius}km
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {obs.observed_on_string}
                    </p>
                    {obs.place_guess && (
                        <p className="text-xs text-muted-foreground truncate">
                            {obs.place_guess}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // Default grid variant
    return (
        <div
            className={cn(
                'bg-white p-3 rounded-lg border-1 hover:shadow-shadow hover:-translate-y-2 transition:shadow duration-300',
                isClickable && 'cursor-pointer',
                className
            )}
            onClick={handleClick}
        >
            {/* Photo Area */}
            {obs.photos.length > 0 && (
                <ProgressiveObservationImage
                    photo={obs.photos[0]}
                    className="aspect-square bg-gray-100 rounded-sm mb-3"
                />
            )}

            {/* Polaroid Caption Area */}
            <div className="flex items-center gap-2">
                <p className="font-medium truncate line-clamp-1">
                    {obs.user.login}
                </p>
                {obs.searchRadius && showRadiusBadges && (
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded-full text-white ${
                            obs.searchRadius === 20
                                ? 'bg-blue-500'
                                : obs.searchRadius === 100
                                  ? 'bg-green-500'
                                  : 'bg-purple-500'
                        }`}
                    >
                        {obs.searchRadius}km
                    </span>
                )}
            </div>
            <p className="text-gray-500 line-clamp-1">
                {obs.observed_on_string}
            </p>
            {obs.place_guess && (
                <p className="text-gray-500 truncate text-[10px] line-clamp-1">
                    📍 {obs.place_guess}
                </p>
            )}
        </div>
    )
}
