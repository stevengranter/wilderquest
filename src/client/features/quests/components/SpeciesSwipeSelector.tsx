import React, { useCallback, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useFormContext, useWatch } from 'react-hook-form'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { Heart, RotateCcw, X } from 'lucide-react'
import {
    Button,
    Badge,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui'
import { useSpeciesSwipe } from '@/features/quests/hooks/useSpeciesSwipe'
import {
    ResponsiveSpeciesGrid,
    ResponsiveSpeciesThumbnail,
    type SpeciesCountItem,
} from '@/features/quests/components/ResponsiveSpeciesThumbnail'
import type { TaxonData } from '../../../types/questTypes'

import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { useSpeciesAddTrigger } from './SpeciesAnimationProvider'
import api from '@/core/api/axios'
import { SpeciesCard } from '@/features/quests/components/SpeciesCard'
import { INatTaxon } from '@shared/types/iNaturalist'

interface SpeciesSwipeSelectorProps {
    questSpecies: Map<number, SpeciesCountItem>
    setQuestSpecies: React.Dispatch<
        React.SetStateAction<Map<number, SpeciesCountItem>>
    >
    onSpeciesAdded?: (species: SpeciesCountItem) => void
    onSpeciesRejected?: (species: SpeciesCountItem) => void
    editMode?: boolean
}

const SWIPE_THRESHOLD = 30

interface SpeciesProgressThumbnailsProps {
    species: SpeciesCountItem[]
    currentIndex: number
    maxThumbnails?: number
    onThumbnailClick?: (species: SpeciesCountItem) => void
}

function SpeciesProgressThumbnails({
    species,
    currentIndex,
    maxThumbnails = 6,
    onThumbnailClick,
}: SpeciesProgressThumbnailsProps) {
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

    // Get the upcoming species to show (including current)
    const upcomingSpecies = species.slice(
        currentIndex,
        currentIndex + maxThumbnails
    )

    if (upcomingSpecies.length === 0) return null

    const handleImageError = (speciesId: number) => {
        setImageErrors((prev) => new Set([...prev, speciesId]))
    }

    return (
        <div className="flex justify-center items-center space-x-1">
            {upcomingSpecies.map((speciesItem, index) => {
                const isCurrent = index === 0
                const _globalIndex = currentIndex + index
                const taxon = speciesItem.taxon
                const hasImageError = imageErrors.has(taxon.id)

                return (
                    <motion.div
                        key={taxon.id}
                        className={`relative group cursor-pointer ${
                            onThumbnailClick ? 'hover:scale-110' : ''
                        }`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: isCurrent ? 1 : 0.6,
                            scale: isCurrent ? 1 : 0.85,
                        }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                        }}
                        style={{
                            zIndex: isCurrent ? 10 : 5 - index,
                            marginLeft: index > 0 ? '-8px' : '0',
                        }}
                        onClick={() => onThumbnailClick?.(speciesItem)}
                        whileHover={
                            onThumbnailClick
                                ? { scale: isCurrent ? 1.05 : 0.9 }
                                : {}
                        }
                        whileTap={
                            onThumbnailClick
                                ? { scale: isCurrent ? 0.95 : 0.8 }
                                : {}
                        }
                    >
                        <div
                            className={`relative rounded-full overflow-hidden border-2 transition-all duration-200 ${
                                isCurrent
                                    ? 'border-blue-500 shadow-lg'
                                    : 'border-gray-300 shadow-sm group-hover:border-gray-400'
                            }`}
                            style={{
                                width: isCurrent ? '40px' : '32px',
                                height: isCurrent ? '40px' : '32px',
                            }}
                        >
                            {taxon.default_photo?.square_url &&
                            !hasImageError ? (
                                <img
                                    src={taxon.default_photo.square_url}
                                    alt={
                                        taxon.preferred_common_name ||
                                        taxon.name
                                    }
                                    className="w-full h-full object-cover"
                                    onError={() => handleImageError(taxon.id)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <span
                                        className="text-gray-400"
                                        style={{
                                            fontSize: isCurrent
                                                ? '16px'
                                                : '12px',
                                        }}
                                    >
                                        🐾
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tooltip with species name */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 z-30">
                            {taxon.preferred_common_name || taxon.name}
                            {onThumbnailClick && !isCurrent && (
                                <div className="text-gray-300 text-xs mt-1">
                                    Click to jump here
                                </div>
                            )}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black" />
                        </div>
                    </motion.div>
                )
            })}

            {/* Show remaining count if there are more */}
            {species.length > currentIndex + maxThumbnails && (
                <motion.div
                    className="flex items-center justify-center rounded-full bg-gray-100 border-2 border-gray-300"
                    style={{
                        width: '32px',
                        height: '32px',
                        marginLeft: '-8px',
                        zIndex: 1,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.6, scale: 0.85 }}
                    transition={{ duration: 0.3, delay: maxThumbnails * 0.05 }}
                >
                    <span className="text-xs text-gray-500 font-medium">
                        +{species.length - currentIndex - maxThumbnails}
                    </span>
                </motion.div>
            )}
        </div>
    )
}

export function SpeciesSwipeSelector({
    questSpecies,
    setQuestSpecies,
    onSpeciesAdded,
    onSpeciesRejected,
}: SpeciesSwipeSelectorProps) {
    const { control } = useFormContext()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })
    const locationName = useWatch({ control, name: 'locationName' })
    const { triggerAnimation } = useSpeciesAddTrigger()
    const swipeAreaRef = useRef<HTMLDivElement>(null)

    const {
        data: speciesCounts,
        isLoading,
        isError,
        refetch,
    } = useQuery<SpeciesCountItem[], Error>({
        queryKey: ['speciesCounts', lat, lon],
        queryFn: () => getSpeciesCountsByGeoLocation(lat, lon, 10, 1, 50),
        enabled: !!lat && !!lon,
    })

    const {
        currentSpecies,
        lastAction,
        hasMoreSpecies,
        handleSwipeComplete,
        handleUndoLastAction,
        handleButtonAction,
        resetSwipeSession,
        getSwipeStats,
        filteredSpecies,
        currentIndex,
        jumpToSpecies,
    } = useSpeciesSwipe({
        availableSpecies: speciesCounts || [],
        questSpecies: questSpecies,
        setQuestSpecies: setQuestSpecies,
        onSpeciesAdded,
        onSpeciesRejected,
    })

    const stats = getSwipeStats()

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
                <p className="text-gray-600">Loading species...</p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <p className="text-red-600 mb-4">Error loading species</p>
                <Button onClick={() => refetch()}>Try Again</Button>
            </div>
        )
    }

    if (!hasMoreSpecies && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-600 mb-4 text-center">
                    {stats.totalSwiped > 0
                        ? "Great job! You've reviewed all available species."
                        : 'No species available to review at this location.'}
                </p>
                {stats.totalSwiped > 0 && (
                    <div className="mb-4 space-y-2">
                        <div className="flex gap-4 text-sm">
                            <Badge variant="neutral" className="text-green-600">
                                ✅ {stats.totalAdded} added
                            </Badge>
                            <Badge variant="neutral" className="text-gray-600">
                                ❌ {stats.totalRejected} skipped
                            </Badge>
                        </div>
                        <Badge variant="default" className="block text-center">
                            {questSpecies.size} total species in quest
                        </Badge>
                    </div>
                )}
                <Button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        resetSwipeSession()
                    }}
                >
                    Start Over
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left Column - Swipe Interface */}
            <div className="flex flex-col lg:col-span-2 order-2 lg:order-1">
                {/*<h3 className="text-lg font-semibold">Add New Species</h3>*/}
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center w-full">
                        {/* Skip Button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        className="rounded-full w-14 h-14 mr-4 bg-rose-500"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleButtonAction('reject')
                                        }}
                                        disabled={!currentSpecies}
                                    >
                                        <X className="w-6 h-6 text-background" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Skip this species</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Swipe Card */}
                        <div
                            ref={swipeAreaRef}
                            className="relative flex  w-[320px] items-center justify-center"
                        >
                            <SwipeCard
                                key={currentSpecies?.taxon.id}
                                species={currentSpecies}
                                onSwipeComplete={handleSwipeComplete}
                                locationData={{
                                    latitude: lat,
                                    longitude: lon,
                                    location_name: locationName,
                                }}
                            />
                        </div>

                        {/* Add Button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="default"
                                        className="rounded-full w-14 h-14 ml-4"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            if (
                                                currentSpecies &&
                                                swipeAreaRef.current
                                            ) {
                                                triggerAnimation(
                                                    currentSpecies,
                                                    swipeAreaRef.current
                                                )
                                            }
                                            handleButtonAction('add')
                                        }}
                                        disabled={!currentSpecies}
                                    >
                                        <Heart className="w-6 h-6 " />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add to quest</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Undo Button */}
                    <div className="flex justify-center items-center mt-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="neutral"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleUndoLastAction()
                                        }}
                                        disabled={!lastAction}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Undo last action</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="mb-4 text-center space-y-3">
                    {/* Species Thumbnails Progress */}
                    <SpeciesProgressThumbnails
                        species={filteredSpecies}
                        currentIndex={currentIndex}
                        maxThumbnails={6}
                        onThumbnailClick={jumpToSpecies}
                    />

                    {/* Stats */}
                    {/*<div className="flex justify-center gap-2 text-xs">*/}
                    {/*    <Badge variant="neutral">*/}
                    {/*        {stats.totalRemaining} remaining*/}
                    {/*    </Badge>*/}
                    {/*    <Badge variant="neutral" className="text-green-600">*/}
                    {/*        {questSpecies.size} selected*/}
                    {/*    </Badge>*/}
                    {/*    {stats.totalAdded > 0 && (*/}
                    {/*        <Badge variant="neutral" className="text-blue-600">*/}
                    {/*            <TrendingUp className="w-3 h-3 mr-1" />*/}
                    {/*            {stats.totalAdded} added today*/}
                    {/*        </Badge>*/}
                    {/*    )}*/}
                    {/*</div>*/}
                </div>

                {/*{lastAction && (*/}
                {/*    <motion.div*/}
                {/*        className="mt-4 p-3 bg-gray-50 rounded-lg text-center"*/}
                {/*        initial={{ opacity: 0, y: 20 }}*/}
                {/*        animate={{ opacity: 1, y: 0 }}*/}
                {/*        transition={{ duration: 0.3 }}*/}
                {/*    >*/}
                {/*        <p className="text-sm text-gray-600">*/}
                {/*            {lastAction.type === 'add'*/}
                {/*                ? '✅ Added'*/}
                {/*                : '❌ Skipped'}{' '}*/}
                {/*            <strong>*/}
                {/*                {lastAction.species.taxon.preferred_common_name}*/}
                {/*            </strong>*/}
                {/*        </p>*/}
                {/*    </motion.div>*/}
                {/*)}*/}
            </div>
            {/* Right Column - Current Quest Species */}
            <div className="flex flex-col lg:col-span-2 order-1 lg:order-2 overflow-y-auto lg:max-h-[70vh] max-h-[60vh]">
                <ResponsiveSpeciesGrid
                    species={Array.from(questSpecies.values())}
                    onRemove={(species) => {
                        const speciesItem = species as SpeciesCountItem
                        setQuestSpecies((prev) => {
                            const newMap = new Map(prev)
                            newMap.delete(speciesItem.taxon.id)
                            return newMap
                        })
                    }}
                    locationData={{
                        latitude: lat,
                        longitude: lon,
                        location_name: locationName,
                    }}
                    showObservationsModal={true}
                />
            </div>
        </div>
    )
}

interface SwipeCardProps {
    species: SpeciesCountItem | undefined
    onSwipeComplete: (
        direction: 'left' | 'right',
        species: SpeciesCountItem
    ) => void
    locationData: {
        latitude: number
        longitude: number
        location_name: string
    }
}

function SwipeCard({ species, onSwipeComplete, locationData }: SwipeCardProps) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-30, 30])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
    const { triggerAnimation } = useSpeciesAddTrigger()
    const cardRef = useRef<HTMLDivElement>(null)

    // Visual feedback transforms
    const skipOpacity = useTransform(x, [-90, -15, 0], [1, 0.6, 0])
    const addOpacity = useTransform(x, [0, 15, 90], [0, 0.6, 1])
    const skipScale = useTransform(x, [-90, -15, 0], [1.2, 0.8, 0.5])
    const addScale = useTransform(x, [0, 15, 90], [0.5, 0.8, 1.2])

    const handleDragEnd = useCallback(
        (
            event: MouseEvent | TouchEvent | PointerEvent,
            {
                offset,
                velocity,
            }: {
                offset: { x: number; y: number }
                velocity: { x: number; y: number }
            }
        ) => {
            document.body.style.userSelect = ''

            if (!species) return

            if (
                Math.abs(offset.x) > SWIPE_THRESHOLD ||
                Math.abs(velocity.x) > 500
            ) {
                const direction = offset.x > 0 ? 'right' : 'left'

                if (direction === 'right' && cardRef.current) {
                    triggerAnimation(species, cardRef.current)
                }

                onSwipeComplete(direction, species)
            }
        },
        [species, onSwipeComplete, triggerAnimation]
    )

    if (!species) {
        return null
    }

    const { taxon } = species

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
        flag_counts: { resolved: 0, unresolved: 0 },
        atlas_id: null,
        complete_species_count: null,
        parent_id: null,
        name_autocomplete: taxon.name,
        matched_term: taxon.name,
        ancestry: '',
        extinct: false,
        taxon_changes_count: 0,
        taxon_schemes_count: 0,
        current_synonymous_taxon_ids: null,
    } as unknown as INatTaxon

    return (
        <motion.div
            ref={cardRef}
            className="h-auto w-full max-w-[320px] cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            style={{ x, rotate, opacity }}
            onDragEnd={handleDragEnd}
            onDragStart={() => {
                document.body.style.userSelect = 'none'
            }}
            onTapCancel={() => {
                document.body.style.userSelect = ''
            }}
            onClickCapture={(e) => {
                if (Math.abs(x.get()) > 5) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }}
            whileHover={{ scale: 1.02 }}
            whileDrag={{
                scale: 1.05,
                cursor: 'grabbing',
            }}
        >
            <div className="relative h-full w-full">
                {/* Skip Indicator */}
                <motion.div
                    className="pointer-events-none absolute left-8 top-1/2 z-20 -translate-y-1/2 transform"
                    style={{ opacity: skipOpacity, scale: skipScale }}
                >
                    <div className="rounded-full bg-red-500 p-4 text-white shadow-lg">
                        <X className="h-8 w-8" />
                    </div>
                    <div className="mt-2 text-center text-lg font-bold text-red-500">
                        SKIP
                    </div>
                </motion.div>

                {/* Add Indicator */}
                <motion.div
                    className="pointer-events-none absolute right-8 top-1/2 z-20 -translate-y-1/2 transform"
                    style={{ opacity: addOpacity, scale: addScale }}
                >
                    <div className="rounded-full bg-green-500 p-4 text-white shadow-lg">
                        <Heart className="h-8 w-8" />
                    </div>
                    <div className="mt-2 text-center text-lg font-bold text-green-500">
                        ADD
                    </div>
                </motion.div>

                {/* Full Card Overlays */}
                {/* Skip Overlay */}
                <motion.div
                    className="pointer-events-none absolute z-10 rounded-xl bg-red-500/20"
                    style={{
                        opacity: skipOpacity,
                        top: '0px',
                        bottom: '0px',
                        left: '0px',
                        right: '0px',
                    }}
                />

                {/* Add Overlay */}
                <motion.div
                    className="pointer-events-none absolute z-10 rounded-xl bg-green-500/20"
                    style={{
                        opacity: addOpacity,
                        top: '0px',
                        bottom: '0px',
                        left: '0px',
                        right: '0px',
                    }}
                />

                <SpeciesCardWithObservations
                    species={inatTaxon}
                    locationData={locationData}
                >
                    <SpeciesCard
                        species={inatTaxon}
                        hoverEffect="none"
                        isSelectable={false}
                        className="h-full w-full"
                    />
                </SpeciesCardWithObservations>
            </div>
        </motion.div>
    )
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10,
    page = 1,
    perPage = 20
) {
    const response = await api.get(
        `/iNatAPI/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false&page=${page}&per_page=${perPage}`
    )
    if (!response.data) {
        return []
    }
    return response.data.results
}
