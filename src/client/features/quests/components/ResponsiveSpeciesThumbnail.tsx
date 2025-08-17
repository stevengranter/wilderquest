'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { SpeciesCardWithObservations } from './SpeciesCardWithObservations'
import { useAnimationTarget } from './SpeciesAnimationProvider'
import { cn } from '@/lib/utils'

interface TaxonData {
    id: number
    name: string
    preferred_common_name: string
    rank?: string
    default_photo?: {
        id: number
        license_code: string
        attribution: string
        url: string
        original_dimensions: { height: number; width: number }
        flags: any[]
        attribution_name: string | null
        square_url: string
        medium_url: string
    }
    iconic_taxon_name?: string
    observations_count?: number
    wikipedia_url?: string
}

interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface ResponsiveSpeciesThumbnailProps {
    species: SpeciesCountItem | TaxonData
    size: number // Size in pixels
    onRemove?: (species: SpeciesCountItem | TaxonData) => void
    className?: string
    questData?: {
        id: string | number
        name: string
        description?: string
        taxon_ids?: number[]
        is_private: boolean
        user_id: string
        created_at: string
        updated_at: string
        location_name?: string
        latitude?: number
        longitude?: number
    }
    locationData?: {
        location_name?: string
        latitude?: number
        longitude?: number
    }
    showObservationsModal?: boolean
}

export function ResponsiveSpeciesThumbnail({
    species,
    size,
    onRemove,
    className,
    questData,
    locationData,
    showObservationsModal = true,
}: ResponsiveSpeciesThumbnailProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Handle both SpeciesCountItem and TaxonData
    const taxon = 'taxon' in species ? species.taxon : species
    const count = 'count' in species ? species.count : undefined

    // Convert to INatTaxon format for SpeciesCardWithObservations
    const inatTaxon = {
        ...taxon,
        iconic_taxon_name: taxon.iconic_taxon_name || null,
        observations_count: taxon.observations_count || 0,
        wikipedia_url: taxon.wikipedia_url || null,
        rank_level: 10,
        iconic_taxon_id: null,
        ancestor_ids: [],
        is_active: true,
        flag_counts: { flagged: false },
        atlas_id: null,
        complete_species_count: null,
        parent_id: null,
        name_autocomplete: taxon.name,
        matched_term: taxon.name,
        min_species_ancestry: null,
        min_species_taxon_id: null,
        complete_rank: taxon.rank || 'species',
    } as any

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onRemove?.(species)
    }

    const thumbnailContent = (
        <motion.div
            className={cn('relative group cursor-pointer', className)}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Main circular thumbnail */}
            <div
                className={cn(
                    'rounded-full overflow-hidden border-2 border-green-500 bg-white shadow-md',
                    'transition-all duration-200 hover:border-green-600 hover:shadow-lg'
                )}
                style={{ width: size, height: size }}
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
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span
                            className="text-gray-400"
                            style={{ fontSize: size * 0.3 }}
                        >
                            🐾
                        </span>
                    </div>
                )}

                {/* Fallback when image fails to load */}
                <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center">
                    <span
                        className="text-gray-400"
                        style={{ fontSize: size * 0.3 }}
                    >
                        🐾
                    </span>
                </div>
            </div>

            {/* Remove button - appears on hover */}
            <AnimatePresence>
                {isHovered && onRemove && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg z-20 flex items-center justify-center"
                        onClick={handleRemove}
                        style={{
                            width: Math.max(16, size * 0.25),
                            height: Math.max(16, size * 0.25),
                        }}
                        type="button"
                    >
                        <X size={Math.max(10, size * 0.15)} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Species name tooltip - appears on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none"
                        style={{ fontSize: Math.max(10, size * 0.12) }}
                    >
                        {taxon.preferred_common_name || taxon.name}
                        {count !== undefined && (
                            <span className="text-gray-300 ml-1">
                                ({count})
                            </span>
                        )}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-black" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )

    // If observations modal is disabled or no location data, return plain thumbnail
    if (!showObservationsModal || (!questData && !locationData)) {
        return thumbnailContent
    }

    // Wrap with observations modal
    return (
        <SpeciesCardWithObservations
            species={inatTaxon}
            questData={questData}
            locationData={locationData}
        >
            {thumbnailContent}
        </SpeciesCardWithObservations>
    )
}

interface ResponsiveSpeciesGridProps {
    species: (SpeciesCountItem | TaxonData)[]
    onRemove?: (species: SpeciesCountItem | TaxonData) => void
    className?: string
    questData?: {
        id: string | number
        name: string
        description?: string
        taxon_ids?: number[]
        is_private: boolean
        user_id: string
        created_at: string
        updated_at: string
        location_name?: string
        latitude?: number
        longitude?: number
    }
    locationData?: {
        location_name?: string
        latitude?: number
        longitude?: number
    }
    showObservationsModal?: boolean
    maxHeight?: string
}

export function ResponsiveSpeciesGrid({
    species,
    onRemove,
    className,
    questData,
    locationData,
    showObservationsModal = true,
    maxHeight = 'max-h-96',
}: ResponsiveSpeciesGridProps) {
    const [containerSize, setContainerSize] = useState({
        width: 300,
        height: 400,
    })
    const targetRef = useAnimationTarget(
        'current-species-list'
    ) as React.RefObject<HTMLDivElement>

    // Calculate responsive thumbnail size
    const calculateThumbnailSize = () => {
        const { width } = containerSize
        const speciesCount = species.length

        if (speciesCount === 0) return 60

        // Base size calculation
        let baseSize = 60

        // Adjust based on container width
        if (width < 200) {
            baseSize = 40
        } else if (width < 300) {
            baseSize = 50
        } else if (width > 500) {
            baseSize = 80
        }

        // Adjust based on species count
        if (speciesCount > 20) {
            baseSize = Math.max(30, baseSize - 20)
        } else if (speciesCount > 10) {
            baseSize = Math.max(40, baseSize - 10)
        } else if (speciesCount > 5) {
            baseSize = Math.max(50, baseSize - 5)
        }

        return baseSize
    }

    const thumbnailSize = calculateThumbnailSize()
    const gap = Math.max(8, thumbnailSize * 0.15)

    // Update container size when component mounts and window resizes
    useEffect(() => {
        const updateSize = () => {
            if (targetRef.current) {
                const rect = targetRef.current.getBoundingClientRect()
                setContainerSize({ width: rect.width, height: rect.height })
            }
        }

        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [targetRef])

    if (species.length === 0) {
        return (
            <motion.div
                ref={targetRef}
                data-current-species-list
                className={cn(
                    'flex flex-col items-center justify-center py-12',
                    className
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                <p className="text-sm text-gray-500 text-center">
                    No species selected yet
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                    Add species from the panel on the right
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            ref={targetRef}
            data-current-species-list
            className={cn('w-full', className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-3 text-center">
                <h3 className="text-sm font-medium text-gray-700">
                    Current Species ({species.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Click to view observations • Hover for name and remove
                    option
                </p>
            </div>

            <div
                className={cn('overflow-y-auto', maxHeight)}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: `${gap}px`,
                    justifyContent:
                        species.length <= 3 ? 'center' : 'flex-start',
                    padding: `${gap}px`,
                }}
            >
                <AnimatePresence mode="popLayout">
                    {species.map((item, index) => {
                        const taxonId =
                            'taxon' in item ? item.taxon.id : item.id
                        return (
                            <motion.div
                                key={taxonId}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: { delay: index * 0.05 },
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    transition: { duration: 0.2 },
                                }}
                            >
                                <ResponsiveSpeciesThumbnail
                                    species={item}
                                    size={thumbnailSize}
                                    onRemove={onRemove}
                                    questData={questData}
                                    locationData={locationData}
                                    showObservationsModal={
                                        showObservationsModal
                                    }
                                />
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
