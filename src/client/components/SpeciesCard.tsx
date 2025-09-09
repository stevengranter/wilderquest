'use client'

import { type INatTaxon } from '@shared/types/iNaturalist'
import { ExternalLink } from 'lucide-react'
import { motion } from 'motion/react'
import React, { useRef } from 'react'
import getKingdomIcon from '@/lib/getKingdomIcon'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'
import { useLazyImage } from '@/hooks/useLazyImage'
import { BiWorld } from 'react-icons/bi'
import { AvatarOverlay } from './AvatarOverlay'

interface SpeciesCardProps {
    species: INatTaxon
    className?: string
    viewMode?: 'list' | 'grid'

    isSelectable?: boolean
    geoObservationsCount?: number
    rarity?: 'common' | 'uncommon' | 'rare'
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
    hasShadow?: boolean
    actionArea?: React.ReactNode
    avatarOverlay?: {
        displayName?: string
        displayNames?: string[]
        firstFinder?: string
    } | null
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
    hasShadow = false,
    actionArea,
    avatarOverlay,
}: SpeciesCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    if (viewMode === 'list') {
        return (
            <SpeciesListItem
                species={species}
                className={className}
                cardRef={cardRef}
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
            isSelectable={isSelectable}
            geoObservationsCount={geoObservationsCount}
            rarity={rarity}
            found={found}
            hoverEffect={hoverEffect}
            hasShadow={hasShadow}
            actionArea={actionArea}
            avatarOverlay={avatarOverlay}
        />
    )
}

interface SpeciesCardSkeletonProps {
    phase?: 'data' | 'image' | 'complete'
}

export function SpeciesCardSkeleton({
    phase = 'data',
}: SpeciesCardSkeletonProps) {
    const getSkeletonColor = () => {
        switch (phase) {
            case 'data':
                return 'bg-gradient-to-b from-gray-200 via-gray-100 to-gray-200'
            case 'image':
                return 'bg-gradient-to-b from-blue-100 via-blue-50 to-blue-100'
            case 'complete':
                return 'bg-gradient-to-b from-green-100 via-green-50 to-green-100'
            default:
                return 'bg-gradient-to-b from-gray-200 via-gray-100 to-gray-200'
        }
    }

    return (
        <Card
            className={`aspect-2.5/3.5 overflow-hidden ${getSkeletonColor()} shadow-0 py-0 gap-0 border-3 rounded-xl border-gray-300 animate-pulse`}
        >
            <CardHeader className="gap-0 pt-2 pb-2">
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="relative px-0 mx-6">
                <Skeleton className="w-full aspect-square rounded-sm" />
                {phase === 'image' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs text-blue-600 font-medium">
                            Loading image...
                        </div>
                    </div>
                )}
            </CardContent>
            <CardContent className="block sm:hidden md:block">
                <div className="h-full bg-gray-200 text-xs content-start text-left p-2 outline-2 rounded-sm">
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </CardContent>
            <CardFooter className="py-4 gap-2">
                <Skeleton className="h-6 w-1/4" />
                {phase === 'complete' && (
                    <div className="absolute bottom-2 right-2">
                        <div className="text-xs text-green-600 font-medium">
                            ✓ Ready
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

function SpeciesGridItem({
    species,
    className,
    cardRef,
    // _isSelectable = true,
    geoObservationsCount,
    rarity,
    found,
    hoverEffect,
    hasShadow = false,
    actionArea,
    avatarOverlay,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    isSelectable?: boolean
    geoObservationsCount?: number
    rarity?: 'common' | 'uncommon' | 'rare'
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
    hasShadow?: boolean
    actionArea?: React.ReactNode
    avatarOverlay?: {
        displayName?: string
        displayNames?: string[]
        firstFinder?: string
    } | null
}) {
    const KingdomIcon = getKingdomIcon(species.iconic_taxon_name)
    const { src, isBlurred, imgRef } = useLazyImage({
        lowQualitySrc: species.default_photo?.square_url || '',
        highQualitySrc: species.default_photo?.medium_url || '',
        rootMargin: '100px', // Load high-res when image is 100px from viewport
        threshold: 0.1,
    })

    const hoverClasses = {
        lift: 'hover:shadow-shadow hover:-translate-y-2 hover:-translate-x-2',
        shadow: 'hover:shadow-shadow',
        none: '',
    }

    const hasShadowClasses = {
        true: 'shadow-shadow',
        false: 'shadow-0',
    }

    return (
        // <AnimatePresence mode="wait">
        //     <motion.div
        //         key={species.id}
        //         layout
        //         initial={{ opacity: 0, y: 20, scale: 0.95 }}
        //         animate={{ opacity: 1, y: 0, scale: 1 }}
        //         exit={{ opacity: 0, y: -20, scale: 0.95 }}
        //         transition={{
        //             layout: {
        //                 duration: 0.4,
        //                 type: 'spring',
        //                 damping: 20,
        //                 stiffness: 200,
        //             },
        //             default: { duration: 0.3 },
        //         }}
        //         whileTap={{ scale: 0.98 }}
        //         className={cn('w-full cursor-pointer', className)}
        //         onClick={handleClick}
        //         ref={cardRef}
        //     >
        <div className="relative">
            <Card
                className={cn(
                    'aspect-2.5/3.5 overflow-hidden duration-250 transition-all shadow-0 py-0 gap-0 border-1 rounded-xl border-slate-400 rotate-0 z-100 flex flex-column justify-between',
                    hoverClasses[hoverEffect || 'lift'],
                    found ? 'bg-green-100' : 'bg-background',
                    hasShadow
                        ? hasShadowClasses['true']
                        : hasShadowClasses['false'],
                    className
                )}
            >
                <CardHeader className="gap-0 text-left justify-start pb-1 pt-3 relative text-foreground tracking-normal font-bold sm:text-md md:text-md lg:text-xl line-clamp-1 font-barlow">
                    {species.preferred_common_name && (
                        <h3>{species.preferred_common_name}</h3>
                    )}
                </CardHeader>

                <CardContent className="relative px-0 mx-6">
                    <div className="absolute -top-1 -right-1">
                        {species.iconic_taxon_name && (
                            <div className="bg-yellow-300 rounded-full text-bg-main-foreground p-2 rotate-15 border-2">
                                <KingdomIcon size={16} />
                            </div>
                        )}
                    </div>

                    {src ? (
                        <div className="overflow-hidden w-full h-full aspect-square rounded-sm">
                            <img
                                ref={imgRef}
                                src={src}
                                alt={species.name}
                                className={cn(
                                    'w-full h-full object-cover border-2 border-white outline-black outline-2',
                                    found && 'bg-teal-300',
                                    isBlurred &&
                                        'filter blur-sm scale-110 transition-all duration-500'
                                )}
                                draggable={false}
                            />
                        </div>
                    ) : (
                        <Skeleton className="w-full aspect-square rounded-sm" />
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
                        {(
                            geoObservationsCount ?? species.observations_count
                        )?.toLocaleString()}
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
                </CardFooter>
                {actionArea}
            </Card>
            {avatarOverlay && (
                <div className="absolute bottom-4 right-8 z-40">
                    <AvatarOverlay
                        displayName={avatarOverlay.displayName}
                        displayNames={avatarOverlay.displayNames}
                        firstFinder={avatarOverlay.firstFinder}
                        className="w-12 h-12 transform translate-x-1/2 translate-y-1/2"
                    />
                </div>
            )}
        </div>
        //     </motion.div>
        // </AnimatePresence>
    )
}

function SpeciesListItem({
    species,
    className,
    cardRef,
    found,
    hoverEffect,
}: {
    species: INatTaxon
    className?: string
    cardRef: React.RefObject<HTMLDivElement | null>
    found?: boolean
    hoverEffect?: 'lift' | 'shadow' | 'none'
}) {
    const { src, isBlurred, imgRef } = useLazyImage({
        lowQualitySrc: species.default_photo?.square_url || '',
        highQualitySrc: species.default_photo?.medium_url || '',
        rootMargin: '100px', // Load high-res when image is 100px from viewport
        threshold: 0.1,
    })
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
                found
                    ? 'bg-green-100 hover:bg-green-200'
                    : 'bg-gray-100 hover:bg-gray-200',
                className
            )}
            ref={cardRef}
        >
            {src && (
                <div className="overflow-hidden h-16 w-16 rounded-sm flex-shrink-0">
                    <img
                        ref={imgRef}
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
            </div>
        </motion.div>
    )
}
