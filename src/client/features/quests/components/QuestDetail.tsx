import { INatTaxon } from '@shared/types/iNatTypes'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { chunk } from 'lodash'
import { Grid, List, Lock, LockOpen, Map, Pencil } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link, useParams } from 'react-router'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Quest = {
    id: string
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

interface QuestProps {
    questId?: string | number
}

export default function QuestDetail({ questId: propQuestId }: QuestProps) {
    const routeParams = useParams()
    const urlQuestId = routeParams.questId
    const activeQuestId = propQuestId || urlQuestId
    const [questData, setQuestData] = useState<Quest | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)
    const [taxa, setTaxa] = useState<INatTaxon[]>([])

    useEffect(() => {
        if (!activeQuestId) {
            setQuestData(null)
            setIsLoading(false)
            setIsError(null)
            return
        }

        const fetchQuest = async () => {
            setIsLoading(true)
            setIsError(null)

            try {
                const response = await api.get(`/quests/${activeQuestId}`)
                setQuestData(response.data)

                if (response.data.taxon_ids?.length) {
                    const taxaIdsChunks = chunk(response.data.taxon_ids, 30)
                    const allTaxaResults: INatTaxon[] = []

                    for (const chunk of taxaIdsChunks) {
                        try {
                            const chunkIds = chunk.join(',')
                            const taxaResponse = await api.get(
                                `/iNatAPI/taxa/${chunkIds}`
                            )

                            if (taxaResponse.data.results) {
                                allTaxaResults.push(
                                    ...taxaResponse.data.results
                                )
                            }
                        } catch (chunkError) {
                            console.error(
                                'Error fetching taxa chunk:',
                                chunkError
                            )
                        }
                    }

                    setTaxa(allTaxaResults)
                }
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setIsError(err.response?.data?.message || err.message)
                } else {
                    setIsError('An unexpected error occurred.')
                }
                setQuestData(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuest()
    }, [activeQuestId])

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError) {
        return <ErrorState error={isError} />
    }

    if (!questData) {
        return <EmptyState />
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-card p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-primary">
                                {questData.name}
                            </h1>
                            {questData.is_private ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <LockOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                        <p className="text-muted-foreground mt-2">
                            {questData.description}
                        </p>
                    </div>
                    <Button variant="default" size="sm" asChild>
                        <Link to={`/quests/${questData.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Quest
                        </Link>
                    </Button>
                </div>

                {questData.location_name && (
                    <div>Location: {questData.location_name}</div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Species ({taxa.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {taxa.map((taxon) => (
                            <Dialog key={taxon.id}>
                                <DialogTrigger className="h-full w-full">
                                    <div className="h-full transform transition-transform hover:scale-105 cursor-pointer">
                                        <SpeciesCard
                                            species={taxon}
                                            className="h-full"
                                        />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[80vw] max-h-[85vh] flex flex-col">
                                    <DialogHeader className="flex-shrink-0">
                                        <DialogTitle>
                                            {taxon.preferred_common_name}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Recent observations near{' '}
                                            {questData.location_name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-y-auto">
                                        {questData.latitude &&
                                            questData.longitude && (
                                                <ObservationList
                                                    taxonId={taxon.id}
                                                    lat={questData.latitude}
                                                    lon={questData.longitude}
                                                />
                                            )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

interface Observation {
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
}

type ViewMode = 'grid' | 'list' | 'map'

function ObservationList({
    taxonId,
    lat,
    lon,
}: {
    taxonId: number
    lat: number
    lon: number
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

    if (isLoading) return <ObservationLoadingState />
    if (isError) return <ObservationErrorState />

    return (
        // In ObservationList, wrap the toggle/header and content in a fixed min-height container
        <motion.div
            className="mt-4 min-h-[480px] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="flex items-center justify-between mb-4 min-h-12"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <h3 className="text-lg font-semibold">
                    Recent Observations ({observations?.length || 0})
                </h3>
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
            <div className="min-h-[350px] overflow-y-auto pt-6 pb-6 box-border">
                {/* Animated content here */}
                {observations && observations.length > 0 ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {viewMode === 'grid' && (
                                <ObservationGridView observations={observations} />
                            )}
                            {viewMode === 'list' && (
                                <ObservationListView observations={observations} />
                            )}
                            {viewMode === 'map' && (
                                <ObservationMapView
                                    observations={observations}
                                    center={[lat, lon]}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-center py-8 text-muted-foreground"
                    >
                        No observations found for this species in this area.
                    </motion.p>
                )}
            </div>
        </motion.div>
    )
}

// Grid View Component
function ObservationGridView({
    observations,
}: {
    observations: Observation[]
}) {
    // Generate random rotation angles for each photo (between -8 and +8 degrees)
    const rotations = observations.map(() => (Math.random() - 0.5) * 16)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
            <AnimatePresence>
                {observations.map((obs, index) => {
                    const rotation = rotations[index]
                    return (
                        <motion.div
                            key={obs.id}
                            initial={{
                                opacity: 0,
                                y: 30,
                                scale: 0.8,
                                rotate: rotation + 10,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                rotate: rotation,
                            }}
                            exit={{
                                opacity: 0,
                                y: -20,
                                scale: 0.8,
                                rotate: rotation - 10,
                            }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.15,
                                ease: 'easeOut',
                                type: 'spring',
                                damping: 15,
                                stiffness: 100,
                            }}
                            whileHover={{
                                scale: 1.05,
                                rotate: 0,
                                y: -8,
                                transition: {
                                    duration: 0.3,
                                    type: 'spring',
                                    damping: 10,
                                    stiffness: 200,
                                },
                            }}
                            whileTap={{
                                scale: 0.95,
                                rotate: rotation * 0.5,
                            }}
                            className="cursor-pointer"
                            style={{
                                transformOrigin: 'center center',
                            }}
                        >
                            {/* Polaroid Card */}
                            <div className="bg-white p-3 rounded-lg border-1 hover:shadow-shadow transtion:shadow duration-300">
                                {/* Photo Area */}
                                <div className="aspect-square bg-gray-100 rounded-sm overflow-hidden mb-3 relative">
                                    {obs.photos.length > 0 ? (
                                        <motion.img
                                            src={obs.photos[0].url.replace(
                                                'square',
                                                'medium'
                                            )}
                                            alt="Observation"
                                            className="w-full h-full object-cover"
                                            initial={{ scale: 1.1, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                duration: 0.8,
                                                delay: index * 0.15 + 0.2,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <div className="text-gray-400 text-sm">
                                                No photo
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Polaroid Caption Area */}
                                <motion.div
                                    className="text-xs text-gray-700 space-y-1"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: index * 0.15 + 0.4,
                                    }}
                                >
                                    <p className="font-medium truncate">
                                        {obs.user.login}
                                    </p>
                                    <p className="text-gray-500">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-gray-500 truncate text-[10px]">
                                            📍 {obs.place_guess}
                                        </p>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}

// List View Component
function ObservationListView({
    observations,
}: {
    observations: Observation[]
}) {
    return (
        <div className="space-y-3">
            <AnimatePresence>
                {observations.map((obs, index) => (
                    <motion.div
                        key={obs.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                        }}
                        whileHover={{ scale: 1.01 }}
                    >
                        <Card className="p-3 cursor-pointer">
                            <div className="flex items-center gap-4">
                                {obs.photos.length > 0 && (
                                    <motion.img
                                        src={obs.photos[0].url.replace(
                                            'medium',
                                            'square'
                                        )}
                                        alt="Observation"
                                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: index * 0.1,
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        Observed by {obs.user.login}
                                    </p>
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
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// Map View Component
function ObservationMapView({
    observations,
    center,
}: {
    observations: Observation[]
    center: [number, number]
}) {
    // Filter observations that have coordinates
    const observationsWithCoords = observations.filter(
        (obs) => obs.geojson?.coordinates || obs.location
    )

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-96 rounded-lg overflow-hidden border"
        >
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="/api/tiles/{z}/{x}/{y}.png"
                />

                {/* Quest center marker */}
                <Marker position={center}>
                    <Popup>Quest Location</Popup>
                </Marker>

                {/* Observation markers */}
                {observationsWithCoords.map((obs) => {
                    const coords = obs.geojson?.coordinates
                        ? ([
                              obs.geojson.coordinates[1],
                              obs.geojson.coordinates[0],
                          ] as [number, number])
                        : obs.location

                    if (!coords) return null

                    return (
                        <Marker key={obs.id} position={coords}>
                            <Popup>
                                <div className="max-w-xs">
                                    {obs.photos.length > 0 && (
                                        <img
                                            src={obs.photos[0].url.replace(
                                                'square',
                                                'medium'
                                            )}
                                            alt="Observation"
                                            className="w-full h-32 object-cover rounded mb-2"
                                        />
                                    )}
                                    <p className="font-medium text-sm">
                                        Observed by {obs.user.login}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </motion.div>
    )
}

// Loading State Component
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                    >
                        <Card className="p-2">
                            <motion.div
                                className="w-full h-48 bg-gray-200 rounded-md mb-2"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <div className="space-y-2">
                                <motion.div
                                    className="h-4 bg-gray-200 rounded w-3/4"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 0.2,
                                    }}
                                />
                                <motion.div
                                    className="h-3 bg-gray-200 rounded w-1/2"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 0.4,
                                    }}
                                />
                            </div>
                        </Card>
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

async function getObservationsByTaxonId(
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

function LoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-4 w-2/3 mb-8" />
                <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                </div>
            </Card>
        </div>
    )
}

function ErrorState({ error }: { error: string }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6 text-center">
                <h2 className="text-xl font-semibold text-destructive mb-2">
                    Error
                </h2>
                <p className="text-muted-foreground">{error}</p>
            </Card>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">No Quest Found</h2>
                <p className="text-muted-foreground mb-4">
                    Please select a collection or navigate to a valid collection
                    ID.
                </p>
                <Button variant="default" asChild>
                    <a href="/quests">View All Quests</a>
                </Button>
            </Card>
        </div>
    )
}
