'use client'

import { INatTaxon } from '@shared/types/iNatTypes'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { TbBinocularsFilled } from 'react-icons/tb'
import getKingdomIcon from '@/components/search/getKingdomIcon'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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

interface MiniSpeciesCardProps {
    species: SpeciesCountItem | TaxonData
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

export function MiniSpeciesCard({
    species,
    onRemove,
    className,
    questData,
    locationData,
    showObservationsModal = true,
}: MiniSpeciesCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Handle both SpeciesCountItem and TaxonData
    const taxon = 'taxon' in species ? species.taxon : species
    const count = 'count' in species ? species.count : undefined
    const KingdomIcon = getKingdomIcon(taxon.iconic_taxon_name || '')

    // Convert to INatTaxon format for SpeciesCardWithObservations
    const inatTaxon: INatTaxon = {
        ...taxon,
        iconic_taxon_name: taxon.iconic_taxon_name || null,
        observations_count: taxon.observations_count || 0,
        wikipedia_url: taxon.wikipedia_url || null,
    } as INatTaxon

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove?.(species)
    }

    const cardContent = (
        <motion.div
            className={cn('relative group cursor-pointer', className)}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{
                duration: 0.3,
                ease: 'easeOut',
            }}
            whileHover={{
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
        >
            <Card
                className={cn(
                    'overflow-hidden bg-gradient-to-b from-emerald-100 via-cyan-50 to-violet-100',
                    'border-2 border-teal-300 hover:border-teal-400',
                    'shadow-md hover:shadow-lg',
                    'transition-all duration-200',
                    'h-32 w-full'
                )}
            >
                <div className="flex h-full">
                    {/* Left side - Image */}
                    <div className="w-24 h-full relative flex-shrink-0">
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
                                <div className="text-gray-400 text-lg">🐾</div>
                            </div>
                        )}

                        {/* Fallback when image fails to load */}
                        <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center">
                            <div className="text-gray-400 text-lg">🐾</div>
                        </div>

                        {/* Kingdom icon */}
                        {taxon.iconic_taxon_name && (
                            <div className="absolute top-1 left-1">
                                <div className="bg-yellow-200 rounded-full p-1.5 border border-yellow-400">
                                    <KingdomIcon size={12} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side - Content */}
                    <div className="flex-1 flex flex-col p-2 min-w-0">
                        {/* Header */}
                        <CardHeader className="p-0 pb-1">
                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">
                                {taxon.preferred_common_name || taxon.name}
                            </h4>
                            {taxon.preferred_common_name && (
                                <p className="text-xs text-gray-500 italic line-clamp-1">
                                    {taxon.name}
                                </p>
                            )}
                        </CardHeader>

                        {/* Content */}
                        <CardContent className="p-0 flex-1 flex flex-col justify-between">
                            <div className="flex flex-wrap gap-1 mb-2">
                                {taxon.rank && (
                                    <Badge
                                        variant="neutral"
                                        className="text-xs px-1 py-0 h-4"
                                    >
                                        {taxon.rank}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>

                        {/* Footer */}
                        <CardFooter className="p-0 flex items-center justify-between">
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs px-1.5 py-0.5 h-5 flex items-center gap-1">
                                <TbBinocularsFilled size={10} />
                                {(
                                    count ?? taxon.observations_count
                                )?.toLocaleString() || '0'}
                            </Badge>

                            {taxon.wikipedia_url && (
                                <Badge
                                    variant="neutral"
                                    className="text-xs px-1 py-0 h-4 text-blue-600"
                                >
                                    Wiki
                                </Badge>
                            )}
                        </CardFooter>
                    </div>
                </div>

                {/* Remove button - only visible on hover */}
                <AnimatePresence>
                    {isHovered && onRemove && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg z-10"
                            onClick={handleRemove}
                            type="button"
                        >
                            <X size={12} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    )

    // If observations modal is disabled or no location data, return plain card
    if (!showObservationsModal || (!questData && !locationData)) {
        return cardContent
    }

    // Wrap with observations modal
    return (
        <SpeciesCardWithObservations
            species={inatTaxon}
            questData={questData}
            locationData={locationData}
        >
            {cardContent}
        </SpeciesCardWithObservations>
    )
}

interface MiniSpeciesCardGridProps {
    species: (SpeciesCountItem | TaxonData)[]
    onRemove?: (species: SpeciesCountItem | TaxonData) => void
    title?: string
    emptyMessage?: string
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
    onSpeciesAdded?: (species: SpeciesCountItem | TaxonData) => void
}

export function MiniSpeciesCardGrid({
    species,
    onRemove,
    title,
    emptyMessage = 'No species selected',
    className,
    questData,
    locationData,
    showObservationsModal = true,
    onSpeciesAdded,
}: MiniSpeciesCardGridProps) {
    const targetRef = useAnimationTarget(
        'current-species-list'
    ) as React.RefObject<HTMLDivElement>
    if (species.length === 0) {
        return (
            <motion.div
                ref={targetRef}
                data-current-species-list
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm text-gray-500">{emptyMessage}</p>
            </motion.div>
        )
    }

    return (
        <motion.div
            ref={targetRef as React.RefObject<HTMLDivElement>}
            data-current-species-list
            className={cn('space-y-3', className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {title && (
                <motion.h3
                    className="text-sm font-medium text-gray-700 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    {title} ({species.length})
                </motion.h3>
            )}

            <motion.div
                className="space-y-2 max-h-96 overflow-y-auto pr-1"
                layout
            >
                <AnimatePresence mode="popLayout">
                    {species.map((item, index) => {
                        const taxonId =
                            'taxon' in item ? item.taxon.id : item.id
                        return (
                            <motion.div
                                key={taxonId}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    transition: { delay: index * 0.05 },
                                }}
                                exit={{
                                    opacity: 0,
                                    x: 20,
                                    scale: 0.9,
                                    transition: { duration: 0.2 },
                                }}
                            >
                                <MiniSpeciesCard
                                    species={item}
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
            </motion.div>

            {onRemove && (
                <motion.p
                    className="text-xs text-gray-500 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    Hover and click ❌ to remove • Click cards to view
                    observations
                </motion.p>
            )}
        </motion.div>
    )
}

// Animation component for when species are added to the quest
export function SpeciesAddAnimation({
    species,
    fromPosition,
    toPosition,
    onComplete,
}: {
    species: SpeciesCountItem | TaxonData
    fromPosition: { x: number; y: number }
    toPosition: { x: number; y: number }
    onComplete: () => void
}) {
    const taxon = 'taxon' in species ? species.taxon : species

    return (
        <motion.div
            className="fixed z-50 pointer-events-none"
            initial={{
                x: fromPosition.x,
                y: fromPosition.y,
                scale: 1,
                opacity: 1,
            }}
            animate={{
                x: toPosition.x,
                y: toPosition.y,
                scale: 0.8,
                opacity: 0.8,
            }}
            exit={{
                scale: 0,
                opacity: 0,
            }}
            transition={{
                duration: 0.6,
                ease: 'easeInOut',
            }}
            onAnimationComplete={onComplete}
        >
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-400 bg-white shadow-lg">
                {taxon.default_photo?.square_url ? (
                    <img
                        src={taxon.default_photo.square_url}
                        alt={taxon.preferred_common_name || taxon.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-gray-400 text-lg">🐾</div>
                    </div>
                )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    ✓
                </motion.div>
            </div>
        </motion.div>
    )
}
