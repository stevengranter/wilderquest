import { INatTaxon } from '@shared/types/iNatTypes'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, Map } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { ReactNode, useState } from 'react'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import titleCase from '@/components/search/titleCase'
// Grid View Component
import {
    Observation,
    ObservationGridView,
    ObservationListView,
    ObservationMapView,
} from '@/features/quests/components/ObservationGridView'
import { MdOutlineLocationOn } from 'react-icons/md'

type Quest = {
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

interface SpeciesCardWithObservationsProps {
    species: INatTaxon
    questData?: Quest
    locationData?: {
        location_name?: string
        latitude?: number
        longitude?: number
    }
    children?: ReactNode
}

export function SpeciesCardWithObservations(
    props: SpeciesCardWithObservationsProps
) {
    const { species, questData, locationData, children } = props
    const displayData = questData || locationData

    if (!displayData?.latitude || !displayData?.longitude) {
        return children || <SpeciesCard species={species} className="h-full" />
    }

    return (
        <Dialog>
            <DialogTrigger className="h-full w-full" asChild>
                <div className="h-full transform transition-transform hover:scale-105 cursor-pointer">
                    {children || (
                        <SpeciesCard species={species} className="h-full" />
                    )}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] max-h-[85vh] flex flex-row gap-6 p-6 bg-secondary-background">
                {/* Left Column: Species Card */}
                <div className="w-1/3 flex-shrink-0">
                    <div className="sticky top-0">
                        <SpeciesCard
                            species={species}
                            className="relative -top-10 md:-left-15 -rotate-5"
                        />
                        <DialogHeader className="-mt-4">
                            <DialogTitle>
                                <VisuallyHidden>
                                    {titleCase(species.preferred_common_name)}
                                </VisuallyHidden>
                            </DialogTitle>
                            <DialogDescription>
                                <VisuallyHidden>
                                    Recent observations located near: {displayData.location_name}
                                </VisuallyHidden>
                            </DialogDescription>

                        </DialogHeader>
                    </div>
                </div>

                {/* Right Column: Observations */}

                <div className="flex-1 overflow-hidden">

                    {displayData.latitude && displayData.longitude && (
                        <ObservationList
                            taxonId={species.id}
                            lat={displayData.latitude}
                            lon={displayData.longitude}
                            locationName={displayData.location_name}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

type ViewMode = 'grid' | 'list' | 'map'

function ObservationList({
    taxonId,
    lat,
    lon,
    locationName
}: {
    taxonId: number
    lat: number
    lon: number
    locationName?: string
}) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const {
        data: observations,
        isLoading,
        isError,
    } = useQuery<Observation[], Error>({
        queryKey: ['observations', taxonId, lat, lon],
        queryFn: () => getObservationsFromINat(taxonId, lat, lon),
        enabled: !!taxonId && !!lat && !!lon,
    })

    const MIN_HEIGHT = 'min-h-[500px]' // consistent height for all states

    return (
        <motion.div
            layout
            transition={{ duration: 0.5, type: 'spring' }}
            className={`mx-2 mt-2`}
        >
            {/* Header / Toggle */}
            <motion.div
                className="flex items-center justify-between mb-4 min-h-12 px-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div className="flex flex-col">
                <h3 className="text-lg font-semibold">
                    Recent Observations ({observations?.length || 0})
                </h3>
                <div className="flex flex-row items-center"><MdOutlineLocationOn className="mr-1" /> {locationName} </div>
                </div>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value: ViewMode) =>
                        value && setViewMode(value)
                    }
                    className="border rounded-lg"
                >
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <Grid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="map" aria-label="Map view">
                        <Map className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </motion.div>

            {/* Content wrapper with fixed height and relative positioning */}
            <div className={`relative ${MIN_HEIGHT} pt-6 pb-6`}>
                {/* Skeleton behind */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            key="loading-skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 overflow-y-auto"
                            style={{ pointerEvents: 'none' }}
                        >
                            <ObservationLoadingState />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actual content on top */}
                {!isLoading && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 overflow-y-auto"
                        >
                            {isError ? (
                                <ObservationErrorState />
                            ) : observations && observations.length > 0 ? (
                                <>
                                    {viewMode === 'grid' && (
                                        <ObservationGridView
                                            observations={observations}
                                        />
                                    )}
                                    {viewMode === 'list' && (
                                        <ObservationListView
                                            observations={observations}
                                        />
                                    )}
                                    {viewMode === 'map' && (
                                        <ObservationMapView
                                            observations={observations}
                                            center={[lat, lon]}
                                        />
                                    )}
                                </>
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No observations found for this species in
                                    this area.
                                </motion.p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    )
}

function ObservationLoadingState() {
    return (
        <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.h3
                className="text-lg font-semibold mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                Recent Observations
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 0.6,
                            delay: i * 0.15,
                            ease: 'easeOut',
                        }}
                        className="cursor-pointer"
                    >
                        {/* Polaroid Card */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            {/* Photo Area: same aspect ratio as your actual photos */}
                            <motion.div
                                className="aspect-square bg-gray-200 rounded-sm overflow-hidden mb-3 relative"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: i * 0.2,
                                }}
                            />
                            {/* Caption placeholders */}
                            <div className="space-y-2">
                                <motion.div
                                    className="h-4 bg-gray-200 rounded w-3/4"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.2 + 0.3,
                                    }}
                                />
                                <motion.div
                                    className="h-3 bg-gray-200 rounded w-1/2"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.2 + 0.6,
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

// Error State Component
function ObservationErrorState() {
    return (
        <motion.p
            className="mt-4 text-red-500 text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            Error fetching observations.
        </motion.p>
    )
}

async function getObservationsFromINat(
    taxonId: number,
    lat: number,
    lon: number
) {
    const response = await api.get(
        `/iNatAPI/observations?taxon_id=${taxonId}&lat=${lat}&lng=${lon}&radius=10&per_page=6&order_by=observed_on`
    )
    if (!response.data) {
        return []
    }
    return response.data.results
}
