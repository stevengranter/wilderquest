import React, { useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useFormContext, useWatch } from 'react-hook-form'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { Heart, RotateCcw, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSpeciesSwipe } from '@/features/quests/hooks/useSpeciesSwipe'
import {
    ResponsiveSpeciesGrid,
    ResponsiveSpeciesThumbnail,
} from '@/features/quests/components/ResponsiveSpeciesThumbnail'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { useSpeciesAddTrigger } from './SpeciesAnimationProvider'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'

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

export interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface SpeciesSwipeSelectorProps {
    questSpecies: Map<number, SpeciesCountItem>
    setQuestSpecies: React.Dispatch<
        React.SetStateAction<Map<number, SpeciesCountItem>>
    >
    onSpeciesAdded?: (species: SpeciesCountItem) => void
    onSpeciesRejected?: (species: SpeciesCountItem) => void
    editMode?: boolean
}

const SWIPE_THRESHOLD = 50

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
        progress,
    } = useSpeciesSwipe({
        availableSpecies: (speciesCounts || []) as any,
        questSpecies: questSpecies as any,
        setQuestSpecies: setQuestSpecies as any,
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
                <div
                    ref={swipeAreaRef}
                    className="relative mb-6 flex h-[520px] items-center justify-center"
                >
                    <SwipeCard
                        key={currentSpecies?.taxon.id}
                        species={currentSpecies}
                        onSwipeComplete={handleSwipeComplete as any}
                        locationData={{
                            latitude: lat,
                            longitude: lon,
                            location_name: locationName,
                        }}
                    />
                </div>

                <div className="flex justify-center items-center gap-4">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="lg"
                                    className="rounded-full w-14 h-14 border-red-200 hover:border-red-300 hover:bg-red-50"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleButtonAction('reject')
                                    }}
                                    disabled={!currentSpecies}
                                >
                                    <X className="w-6 h-6 text-red-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Skip this species</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

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

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="lg"
                                    className="rounded-full w-14 h-14 border-green-200 hover:border-green-300 hover:bg-green-50"
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
                                    <Heart className="w-6 h-6 text-green-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add to quest</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Progress Indicator */}
                <div className="mb-4 text-center space-y-3">


                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Instructions */}
                    {/*<div className="flex justify-center items-center gap-4 text-sm text-gray-600">*/}
                    {/*    <div className="flex items-center gap-1">*/}
                    {/*        <X className="w-4 h-4 text-red-500" />*/}
                    {/*        <span>Skip</span>*/}
                    {/*    </div>*/}
                    {/*    <div className="flex items-center gap-1">*/}
                    {/*        <Heart className="w-4 h-4 text-green-500" />*/}
                    {/*        <span>Add</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/* Stats */}
                    <div className="flex justify-center gap-2 text-xs">
                        <Badge variant="neutral">
                            {stats.totalRemaining} remaining
                        </Badge>
                        <Badge variant="neutral" className="text-green-600">
                            {questSpecies.size} selected
                        </Badge>
                        {stats.totalAdded > 0 && (
                            <Badge variant="neutral" className="text-blue-600">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {stats.totalAdded} added today
                            </Badge>
                        )}
                    </div>
                </div>

                {lastAction && (
                    <motion.div
                        className="mt-4 p-3 bg-gray-50 rounded-lg text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-sm text-gray-600">
                            {lastAction.type === 'add'
                                ? '✅ Added'
                                : '❌ Skipped'}{' '}
                            <strong>
                                {lastAction.species.taxon.preferred_common_name}
                            </strong>
                        </p>
                    </motion.div>
                )}
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
    const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.6, 0])
    const addOpacity = useTransform(x, [0, 50, 150], [0, 0.6, 1])
    const skipScale = useTransform(x, [-150, -50, 0], [1.2, 0.8, 0.5])
    const addScale = useTransform(x, [0, 50, 150], [0.5, 0.8, 1.2])

    const handleDragEnd = useCallback(
        (event: any, { offset, velocity }: any) => {
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

    return (
        <motion.div
            ref={cardRef}
            className="h-[480px] w-full max-w-[320px] cursor-grab active:cursor-grabbing"
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

                <SpeciesCardWithObservations
                    species={taxon}
                    locationData={locationData}
                >
                    <SpeciesCard
                        species={taxon}
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
    perPage = 50
) {
    const response = await api.get(
        `/iNatAPI/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false&page=${page}&per_page=${perPage}`
    )
    if (!response.data) {
        return []
    }
    return response.data.results
}
