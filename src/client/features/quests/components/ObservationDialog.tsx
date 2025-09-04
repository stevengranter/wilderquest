import { INatTaxon } from '@shared/types/iNatTypes'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, Map as MapIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { ReactNode, useEffect, useState } from 'react'
import api from '@/api/api'
import { SpeciesCard } from '@/features/quests/components/SpeciesCard'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

// Grid View Component
import {
    Observation,
    ObservationGridView,
    ObservationListView,
    ObservationMapView,
} from '@/features/quests/components/ObservationGridView'
import { MdOutlineLocationOn } from 'react-icons/md'
import { usePrefetchTaxonPhoto } from '@/hooks/useTaxonPhotos'

interface ObservationDialogProps {
    species: INatTaxon
    latitude?: number
    longitude?: number
    locationName?: string
    children: ReactNode
    found?: boolean
}

export function ObservationDialog(props: ObservationDialogProps) {
    const { species, latitude, longitude, locationName, children, found } =
        props
    const prefetchTaxonPhoto = usePrefetchTaxonPhoto()
    const [open, setOpen] = useState(false)

    console.log(
        `ObservationDialog: Initialized for species ${species.id} (${species.name})`,
        {
            hasCoordinates: !!(latitude && longitude),
            coordinates:
                latitude && longitude ? `${latitude}, ${longitude}` : 'none',
            locationName,
            found,
        }
    )

    // preserve scroll when dialog opens/closes
    useEffect(() => {
        if (open) {
            console.log(
                `ObservationDialog: Opened for species ${species.id} (${species.name})`
            )
            const unlock = lockScroll()
            return unlock
        }
    }, [open, species.id, species.name])

    // Always render the dialog, but pass location info if available

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger
                className="h-full w-full"
                asChild
                onMouseEnter={() => prefetchTaxonPhoto(species.id)}
            >
                <div className="h-full cursor-pointer">{children}</div>
            </DialogTrigger>

            {/* Custom overlay (works even with modal={false}) */}
            {open && (
                <DialogPortal>
                    <div
                        aria-hidden="true"
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
                        onClick={() => setOpen(false)}
                    />
                </DialogPortal>
            )}

            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="sm:max-w-[80%] h-[80%] max-h-[90%] flex flex-col md:flex-row gap-6 p-6 bg-background z-50"
            >
                {/* Mobile Header */}
                <div className="md:hidden flex items-center gap-4 border-b pb-4">
                    {species.default_photo && (
                        <img
                            src={species.default_photo.square_url}
                            alt={species.name}
                            className="w-12 h-12 rounded-md object-cover"
                        />
                    )}
                    <DialogTitle className="text-lg">
                        {species.preferred_common_name}
                    </DialogTitle>
                </div>

                {/* Left Column: Species Card (Desktop) */}
                <div className="hidden md:block w-1/3 flex-shrink-0">
                    <div className="sticky top-0">
                        <SpeciesCard
                            species={species}
                            className="relative -top-10 md:-left-15 -rotate-5"
                            found={found}
                            hoverEffect="none"
                            hasShadow={true}
                        />
                        <DialogHeader className="-mt-4">
                            <DialogTitle>
                                <VisuallyHidden>
                                    {species.preferred_common_name}
                                </VisuallyHidden>
                            </DialogTitle>
                            <DialogDescription>
                                <VisuallyHidden>
                                    Recent observations located near:{' '}
                                    {locationName}
                                </VisuallyHidden>
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Right Column: Observations */}
                <div className="flex-1 overflow-hidden -ml-10">
                    <ObservationList
                        taxonId={species.id}
                        lat={latitude}
                        lon={longitude}
                        locationName={locationName}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

// --- Scroll lock helper ---
function lockScroll() {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
    }
}

type ViewMode = 'grid' | 'list' | 'map'

function ObservationList({
    taxonId,
    lat,
    lon,
    locationName,
}: {
    taxonId: number
    lat?: number
    lon?: number
    locationName?: string
}) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [searchRadius, setSearchRadius] = useState<number>(10) // Default 10km radius
    const [showGlobal, setShowGlobal] = useState<boolean>(false)

    // Ensure coords are numbers and round for stable caching
    const hasValidCoords =
        lat !== undefined &&
        lon !== undefined &&
        !isNaN(Number(lat)) &&
        !isNaN(Number(lon))
    const roundedLat = hasValidCoords
        ? Math.round(Number(lat) * 10000) / 10000
        : undefined
    const roundedLon = hasValidCoords
        ? Math.round(Number(lon) * 10000) / 10000
        : undefined

    const {
        data: observations,
        isLoading,
        isError,
        error,
    } = useQuery<Observation[], Error>({
        queryKey: [
            'observations',
            taxonId,
            roundedLat,
            roundedLon,
            searchRadius,
            showGlobal,
        ],
        queryFn: () =>
            getObservationsFromINat(
                taxonId,
                roundedLat,
                roundedLon,
                searchRadius,
                showGlobal
            ),
        enabled: !!taxonId,
        retry: (failureCount, error) => {
            // Don't retry on 4xx errors (client errors)
            if (
                error &&
                'status' in error &&
                typeof error.status === 'number' &&
                error.status >= 400 &&
                error.status < 500
            ) {
                return false
            }
            // Retry up to 2 times for other errors
            return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })

    return (
        <div className={`mx-2 mt-2 flex h-full flex-col`}>
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
                        {showGlobal && (
                            <span className="text-xs text-green-600 ml-2">
                                (Global)
                            </span>
                        )}
                        {searchRadius > 10 && !showGlobal && (
                            <span className="text-xs text-blue-600 ml-2">
                                (Expanded)
                            </span>
                        )}
                    </h3>
                    <div className="flex flex-row items-center">
                        <MdOutlineLocationOn className="mr-1" />
                        {showGlobal
                            ? 'Global observations'
                            : locationName
                              ? `${locationName}${hasValidCoords ? ` (${searchRadius}km radius)` : ''}`
                              : hasValidCoords
                                ? `${searchRadius}km radius`
                                : 'Global observations'}
                    </div>
                </div>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value: ViewMode) =>
                        value && setViewMode(value)
                    }
                    className="border-0 rounded-lg"
                >
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <Grid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="map" aria-label="Map view">
                        <MapIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </motion.div>

            {/* Content wrapper with fixed height and relative positioning */}
            <div className={`relative flex-1`}>
                {/* Skeleton behind */}
                {isLoading && (
                    <motion.div
                        key="loading-skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 overflow-y-auto pt-6 pb-6"
                        style={{ pointerEvents: 'none' }}
                    >
                        <ObservationLoadingState />
                    </motion.div>
                )}

                {/* Actual content on top */}
                {!isLoading && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 overflow-y-auto pt-6 pb-6"
                        >
                            {isError ? (
                                <ObservationErrorState error={error} />
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
                                    {viewMode === 'map' &&
                                        lat !== undefined &&
                                        lon !== undefined && (
                                            <ObservationMapView
                                                observations={observations}
                                                center={[lat, lon]}
                                            />
                                        )}
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="text-center py-8"
                                >
                                    <p className="text-muted-foreground mb-4">
                                        {hasValidCoords && !showGlobal
                                            ? `No observations found for this species within ${searchRadius}km.`
                                            : `No observations found for this species globally.`}
                                    </p>

                                    {hasValidCoords &&
                                        !showGlobal &&
                                        searchRadius < 100 && (
                                            <div className="flex flex-col gap-3 items-center">
                                                <button
                                                    onClick={() =>
                                                        setSearchRadius(
                                                            Math.min(
                                                                searchRadius *
                                                                    2,
                                                                100
                                                            )
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                                                >
                                                    Expand search to{' '}
                                                    {Math.min(
                                                        searchRadius * 2,
                                                        100
                                                    )}
                                                    km
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setShowGlobal(true)
                                                    }
                                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                                                >
                                                    Show global observations
                                                </button>
                                            </div>
                                        )}

                                    {hasValidCoords && showGlobal && (
                                        <button
                                            onClick={() => {
                                                setShowGlobal(false)
                                                setSearchRadius(10)
                                            }}
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                        >
                                            Back to local search
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
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
                        <div className="bg-white p-3 rounded-lg border border-gray-800">
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
function ObservationErrorState({ error }: { error?: Error }) {
    const getErrorMessage = (error?: Error) => {
        if (!error) return 'Error fetching observations.'

        // Check for specific error types
        if ('status' in error) {
            const status = error.status as number
            if (status === 429) {
                return 'Too many requests. Please wait a moment and try again.'
            }
            if (status === 404) {
                return 'Species not found in the database.'
            }
            if (status >= 500) {
                return 'Server error. Please try again later.'
            }
            if (status >= 400) {
                return 'Unable to fetch observations. Please check your connection.'
            }
        }

        // Network or other errors
        if (
            error.message?.includes('Network Error') ||
            error.message?.includes('fetch')
        ) {
            return 'Network error. Please check your internet connection and try again.'
        }

        return 'Error fetching observations. Please try again.'
    }

    return (
        <motion.div
            className="mt-4 text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <p className="text-red-500 mb-4">{getErrorMessage(error)}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
                Retry
            </button>
        </motion.div>
    )
}

async function getObservationsFromINat(
    taxonId: number,
    lat?: number,
    lon?: number,
    radius: number = 10,
    globalSearch: boolean = false
) {
    let url = `/iNatAPI/observations?taxon_id=${taxonId}&per_page=6&order_by=observed_on`

    // Add location parameters if coordinates are provided and not doing global search
    if (!globalSearch && lat !== undefined && lon !== undefined) {
        url += `&lat=${lat}&lng=${lon}&radius=${radius}`
    }

    try {
        const searchType = globalSearch
            ? 'global'
            : lat !== undefined && lon !== undefined
              ? `at ${lat}, ${lon} (radius: ${radius}km)`
              : 'global'
        console.log(
            `Fetching observations for taxon ${taxonId} (${searchType})`
        )
        const response = await api.get(url)

        if (!response.data) {
            console.warn(`No data returned for observations request: ${url}`)
            return []
        }

        const results = response.data.results || []
        console.log(
            `Fetched ${results.length} observations for taxon ${taxonId}`
        )
        return results
    } catch (error) {
        console.error(
            `Error fetching observations for taxon ${taxonId}:`,
            error
        )
        throw error
    }
}
