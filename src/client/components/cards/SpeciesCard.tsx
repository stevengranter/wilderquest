'use client'

import { type INatTaxon } from '@shared/types/iNatTypes'
import { ExternalLink } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useRef } from 'react'
import getKingdomIcon from '@/components/search/getKingdomIcon'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import { cn } from '@/lib/utils'
import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import { BiWorld } from 'react-icons/bi'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
    viewMode?: 'list' | 'grid'
    isSelectionMode?: boolean
    isSelectable?: boolean
    geoObservationsCount?: number
    rarity?: 'common' | 'uncommon' | 'rare'
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
}

export function SpeciesCard({
    species,
    className,
    viewMode,
    isSelectable = true,
    geoObservationsCount,
    rarity,
    found,
    hoverEffect,
}: SpeciesCardProps) {
    const {
        isSelectionMode,
        selectedIds,
        addIdToSelection,
        removeIdFromSelection,
    } = useSelectionContext()
    const cardRef = useRef<HTMLDivElement>(null)
    const isSelected = selectedIds.includes(species.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode) {
            e.preventDefault()
            if (isSelectable) selectCard()
        }
    }

    const selectCard = () => {
        const id = species.id.toString()
        if (isSelected) removeIdFromSelection(id)
        else addIdToSelection(id)
    }

    if (viewMode === 'list') {
        return (
            <SpeciesListItem
                species={species}
                className={className}
                cardRef={cardRef}
                isSelected={isSelected}
                handleClick={handleClick}
                found={found}
                hoverEffect={hoverEffect}
            />
        )
    }

    return (
        <SpeciesGridItem
            species={species}
            className={className}
            cardRef={cardRef}
            isSelected={isSelected}
            isSelectable={isSelectable}
            handleClick={handleClick}
            geoObservationsCount={geoObservationsCount}
            rarity={rarity}
            found={found}
            hoverEffect={hoverEffect}
        />
    )
}

export function SpeciesCardSkeleton() {
    return (
        <Card className="aspect-2.5/3.5 overflow-hidden bg-gradient-to-b from-gray-200 via-gray-100 to-gray-200 shadow-0 py-0 gap-0 border-3 rounded-xl border-gray-300">
            <CardHeader className="gap-0 pt-2 pb-2">
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="relative px-0 mx-6">
                <Skeleton className="w-full aspect-square rounded-sm" />
            </CardContent>
            <CardContent className="block sm:hidden md:block">
                <div className="h-full bg-gray-200 text-xs content-start text-left p-2 outline-2 rounded-sm">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </CardContent>
            <CardFooter className="py-4 gap-2">
                <Skeleton className="h-6 w-1/4" />
            </CardFooter>
        </Card>
    )
}

function SpeciesGridItem({
    species,
    className,
    cardRef,
    isSelected,
    // _isSelectable = true,
    handleClick,
    geoObservationsCount,
    rarity,
    found,
    hoverEffect,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    isSelected: boolean
    handleClick: (e: React.MouseEvent) => void
    isSelectable?: boolean
    geoObservationsCount?: number
    rarity?: 'common' | 'uncommon' | 'rare'
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
}) {
    const KingdomIcon = getKingdomIcon(species.iconic_taxon_name)
    const { src, isBlurred } = useProgressiveImage(
        species.default_photo?.square_url || '',
        species.default_photo?.medium_url || ''
    )

    const hoverClasses = {
        lift: 'hover:shadow-shadow hover:-translate-y-2 hover:-translate-x-2',
        shadow: 'hover:shadow-shadow',
        none: '',
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={species.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                    layout: {
                        duration: 0.4,
                        type: 'spring',
                        damping: 20,
                        stiffness: 200,
                    },
                    default: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.98 }}
                className={cn('w-full cursor-pointer', className)}
                onClick={handleClick}
                ref={cardRef}
            >
                <Card
                    className={cn(
                        'aspect-2.5/3.5 overflow-hidden duration-250 transition-all shadow-0 py-0 gap-0 border-1 rounded-xl border-slate-400 rotate-0 z-100 flex flex-column justify-between',
                        isSelected && 'ring-2 ring-blue-500 shadow-blue-200/50',
                        hoverClasses[hoverEffect || 'lift'],
                        found ? 'bg-green-100' : 'bg-background'
                    )}
                >
                    <CardHeader
                        className="gap-0 text-left justify-start pb-1 pt-3 relative text-foreground tracking-normal font-bold sm:text-md md:text-md lg:text-xl line-clamp-1 font-barlow"
                    >
                        {species.preferred_common_name && (
                            <h3>{species.preferred_common_name}</h3>
                        )}
                    </CardHeader>

                    <CardContent className="relative px-0 mx-6">
                        <div className="absolute -top-3 -right-3">
                            {species.iconic_taxon_name && (
                                <div className="bg-yellow-300 rounded-full text-bg-main-foreground p-2 rotate-15 border-2">
                                    <KingdomIcon size={20} />
                                </div>
                            )}
                        </div>

                        {src ? (
                            <div className="overflow-hidden w-full h-full aspect-square rounded-sm">
                                <img
                                    src={src}
                                    alt={species.name}
                                    className={cn(
                                        'w-full h-full object-cover border-2 border-white outline-black outline-2',
                                        found && 'bg-teal-300',
                                        isBlurred &&
                                            'filter blur-sm scale-110 transition-all duration-500'
                                    )}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-gray-400 text-xs text-center px-2">
                                    No image
                                </div>
                            </div>
                        )}

                        <div className="space-y-1 text-right self-end mt-1 mb-2">
                            {species.preferred_common_name && (
                                <p className="text-[11px] text-foreground italic leading-tight line-clamp-1">
                                    {species.name}
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-row justify-start items-center py-2 pb-4">
                        <Badge>
                            <BiWorld size={15} />
                            {( geoObservationsCount ?? species.observations_count )?.toLocaleString()}
                        </Badge>

                        {rarity && (
                            <Badge
                                className={cn(
                                    'text-xs font-semibold border-0',
                                    rarity === 'common'
                                        ? 'bg-green-100 text-green-800'
                                        : rarity === 'uncommon'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                )}
                            >
                                {rarity.toUpperCase()}
                            </Badge>
                        )}

                        {isSelected && (
                            <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-blue-500 text-white text-[10px] font-medium px-2 py-0.5 rounded text-center">
                                    ✓ Selected
                                </div>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
        </AnimatePresence>
    )
}

function SpeciesListItem({
    species,
    className,
    cardRef,
    isSelected,
    handleClick,
    found,
    hoverEffect,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    isSelected: boolean
    handleClick: (e: React.MouseEvent) => void
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
}) {
    const { src, isBlurred } = useProgressiveImage(
        species.default_photo?.square_url || '',
        species.default_photo?.medium_url || ''
    )
    const KingdomIcon = getKingdomIcon(species.iconic_taxon_name)

    const hoverClasses = {
        lift: 'hover:shadow-md hover:-translate-y-px',
        shadow: 'hover:shadow-md',
        none: '',
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ default: { duration: 0.5 } }}
            className={cn(
                'flex items-center gap-4 p-2 rounded-md transition-all duration-200',
                hoverClasses[hoverEffect || 'lift'],
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                found
                    ? 'bg-green-100 hover:bg-green-200'
                    : 'bg-gray-100 hover:bg-gray-200',
                className
            )}
            onClick={handleClick}
            ref={cardRef}
        >
            {src && (
                <div className="overflow-hidden h-16 w-16 rounded-sm flex-shrink-0">
                    <img
                        src={src}
                        alt={species.name}
                        className={cn(
                            'h-full w-full object-cover',
                            isBlurred &&
                                'filter blur-sm scale-110 transition-all duration-500'
                        )}
                    />
                </div>
            )}
            <div className="flex-grow">
                <div className="font-semibold text-base">
                    {species.preferred_common_name || species.name}
                </div>
                {species.preferred_common_name && (
                    <div className="text-sm text-muted-foreground italic">
                        {species.name}
                    </div>
                )}
                <div className="flex gap-2 items-center mt-1">
                    {species.iconic_taxon_name && (
                        <Badge
                            variant="default"
                            className="flex items-center gap-1.5 text-xs"
                        >
                            {KingdomIcon && <KingdomIcon size={12} />}
                            {species.iconic_taxon_name}
                        </Badge>
                    )}
                    {species.rank && (
                        <Badge variant="neutral" className="text-xs capitalize">
                            {species.rank}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
                <div className="text-xs text-muted-foreground">
                    {species.observations_count} obs.
                </div>
                {species.wikipedia_url && (
                    <a
                        href={species.wikipedia_url}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Wikipedia
                    </a>
                )}
                {isSelected && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                        ✓ Selected
                    </div>
                )}
            </div>
        </motion.div>
    )
}
