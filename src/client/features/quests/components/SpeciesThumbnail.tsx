import React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TaxonData {
    id: number
    name: string
    preferred_common_name: string
    rank?: string
    default_photo?: {
        id: number
        license_code: string | null
        attribution: string
        url: string
        original_dimensions: { height: number; width: number }
        flags: unknown[]
        attribution_name: string | null
        square_url: string
        medium_url: string
    }
}

interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface SpeciesThumbnailProps {
    species: SpeciesCountItem | TaxonData
    size?: 'sm' | 'md' | 'lg'
    onRemove?: () => void
    showRemove?: boolean
    className?: string
    showTooltip?: boolean
}

export function SpeciesThumbnail({
    species,
    size = 'md',
    onRemove,
    showRemove = true,
    className = '',
    showTooltip = true,
}: SpeciesThumbnailProps) {
    // Handle both SpeciesCountItem and TaxonData
    const taxon = 'taxon' in species ? species.taxon : species
    const count = 'count' in species ? species.count : undefined

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    }

    const iconSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3',
    }

    const removeBadgeSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }

    const textSizes = {
        sm: 'text-xs',
        md: 'text-xs',
        lg: 'text-sm',
    }

    return (
        <div className={`relative group ${className}`}>
            <div
                className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-green-500 transition-colors ${
                    showRemove && onRemove
                        ? 'hover:border-red-500 cursor-pointer'
                        : ''
                }`}
                onClick={onRemove}
            >
                {taxon.default_photo?.square_url ? (
                    <img
                        src={taxon.default_photo.square_url}
                        alt={taxon.preferred_common_name || taxon.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove(
                                'hidden'
                            )
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <span
                            className={
                                size === 'sm'
                                    ? 'text-xs'
                                    : size === 'md'
                                      ? 'text-sm'
                                      : 'text-lg'
                            }
                        >
                            🐾
                        </span>
                    </div>
                )}

                {/* Fallback when image fails to load */}
                <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500">
                    <span
                        className={
                            size === 'sm'
                                ? 'text-xs'
                                : size === 'md'
                                  ? 'text-sm'
                                  : 'text-lg'
                        }
                    >
                        🐾
                    </span>
                </div>
            </div>

            {/* Remove indicator on hover */}
            {showRemove && onRemove && (
                <div
                    className={`absolute -top-0.5 -right-0.5 ${removeBadgeSizes[size]} bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                >
                    <X className={iconSizes[size]} />
                </div>
            )}

            {/* Observation count badge */}
            {count !== undefined && count > 0 && (
                <div className="absolute -bottom-1 -right-1">
                    <Badge
                        variant="default"
                        className={`${textSizes[size]} px-1 py-0 min-w-0 h-4 bg-blue-500 text-white border-none`}
                    >
                        {count > 99 ? '99+' : count}
                    </Badge>
                </div>
            )}

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {taxon.preferred_common_name || taxon.name}
                    {showRemove && onRemove && (
                        <span className="block text-red-300">
                            Click to remove
                        </span>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                </div>
            )}
        </div>
    )
}

interface SpeciesThumbnailGridProps {
    species: (SpeciesCountItem | TaxonData)[]
    onRemove?: (species: SpeciesCountItem | TaxonData) => void
    title?: string
    emptyMessage?: string
    maxHeight?: string
    size?: 'sm' | 'md' | 'lg'
    showRemove?: boolean
}

export function SpeciesThumbnailGrid({
    species,
    onRemove,
    title,
    emptyMessage = 'No species selected',
    maxHeight = 'max-h-24',
    size = 'md',
    showRemove = true,
}: SpeciesThumbnailGridProps) {
    if (species.length === 0) {
        return (
            <div className="text-center py-4">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="mb-4">
            {title && (
                <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
                    {title} ({species.length})
                </h3>
            )}
            <div
                className={`flex flex-wrap justify-center gap-2 ${maxHeight} overflow-y-auto`}
            >
                {species.map((item) => {
                    const taxonId = 'taxon' in item ? item.taxon.id : item.id
                    return (
                        <SpeciesThumbnail
                            key={taxonId}
                            species={item}
                            size={size}
                            onRemove={
                                onRemove ? () => onRemove(item) : undefined
                            }
                            showRemove={showRemove && !!onRemove}
                        />
                    )
                })}
            </div>
            {showRemove && onRemove && (
                <p className="text-xs text-gray-500 text-center mt-2">
                    Click thumbnails to remove species
                </p>
            )}
        </div>
    )
}
