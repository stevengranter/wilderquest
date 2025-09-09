'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
    SpeciesCardWithObservations,
    ClientQuest,
} from './SpeciesCardWithObservations'
import { useAnimationTarget } from './SpeciesAnimationProvider'
import { cn } from '@/lib/utils'
import { INatTaxon } from '@shared/types/iNaturalist'
import { TaxonData } from '../types/questTypes'

export interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface ResponsiveSpeciesThumbnailProps {
    species: SpeciesCountItem | TaxonData
    size: number // Size in pixels
    onRemove?: (species: SpeciesCountItem | TaxonData) => void
    className?: string
    questData?: ClientQuest
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
    const [imageError, setImageError] = useState(false)
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
    } as unknown as INatTaxon

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onRemove?.(species)
    }

    const thumbnailContent = (
        <div
            className={cn('relative group cursor-pointer', className)}
            style={{ width: size, height: size }}
        >
            <div
                className={cn(
                    'rounded-full overflow-hidden border-2 border-green-500 bg-white shadow-md',
                    'transition-all duration-200 group-hover:border-green-600 group-hover:shadow-lg group-hover:scale-105'
                )}
            >
                {taxon.default_photo?.square_url && !imageError ? (
                    <img
                        src={taxon.default_photo.square_url}
                        alt={taxon.preferred_common_name || taxon.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
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
            </div>

            {onRemove && (
                <button
                    onClick={handleRemove}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-red-600 z-20"
                    style={{
                        width: Math.max(16, size * 0.3),
                        height: Math.max(16, size * 0.3),
                    }}
                    type="button"
                    aria-label="Remove species"
                >
                    <X size={Math.max(10, size * 0.18)} />
                </button>
            )}

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-30">
                {taxon.preferred_common_name || taxon.name}
                {count !== undefined && (
                    <span className="text-gray-300 ml-1">({count})</span>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black" />
            </div>
        </div>
    )

    if (!showObservationsModal || (!questData && !locationData)) {
        return thumbnailContent
    }

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
    questData?: ClientQuest
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

    const calculateThumbnailSize = () => {
        const { width } = containerSize
        const speciesCount = species.length

        if (speciesCount === 0) return 60

        let baseSize = 60

        if (width < 200) {
            baseSize = 40
        } else if (width < 300) {
            baseSize = 50
        } else if (width > 500) {
            baseSize = 80
        }

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

    React.useEffect(() => {
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
                {/*<p className="text-xs text-gray-500 mt-1">*/}
                {/*    Click to view observations • Hover for name and remove*/}
                {/*    option*/}
                {/*</p>*/}
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
                                className="relative"
                                whileHover={{ zIndex: 10 }}
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
