import { INatTaxon } from '@shared/types'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, Map as MapIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { ReactNode, useEffect, useState } from 'react'
import api from '@/core/api/axios'
import { SpeciesCard } from '@/features/quests/components/SpeciesCard'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
    ToggleGroup,
    ToggleGroupItem,
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

// Grid View Component
import { Observation } from './ObservationCard'
import {
    ObservationGridView,
    ObservationListView,
    ObservationMapView,
} from './observation-views'
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

    const [searchRadius, setSearchRadius] = useState<number>(20)
    const [showGlobal, setShowGlobal] = useState<boolean>(false)

    // Ensure coords are numbers and round for stable caching
    const hasValidCoords =
        latitude !== undefined &&
        longitude !== undefined &&
        !isNaN(Number(latitude)) &&
        !isNaN(Number(longitude))
    const roundedLat = hasValidCoords
        ? Math.round(Number(latitude) * 10000) / 10000
        : undefined
    const roundedLon = hasValidCoords
        ? Math.round(Number(longitude) * 10000) / 10000
        : undefined

    // Get all radii that should be included for cumulative results
    const getCumulativeRadii = (currentRadius: number): number[] => {
        const radii = [20, 100, 1000]
        return radii.filter((radius) => radius <= currentRadius)
    }

    const cumulativeRadii = getCumulativeRadii(searchRadius)

    // Track previous cumulative radii to identify new radius being fetched
    const [previousCumulativeRadii, setPreviousCumulativeRadii] =
        React.useState<number[]>([])

    const {
        data: observations,
        isLoading,
        isError,
        error,
    } = useQuery<Observation[], Error>({
        queryKey: [
            'observations-cumulative',
            species.id,
            roundedLat,
            roundedLon,
            cumulativeRadii,
            showGlobal,
        ],
        queryFn: () =>
            getCumulativeObservationsFromINat(
                species.id,
                cumulativeRadii,
                roundedLat,
                roundedLon,
                showGlobal
            ),
        enabled: !!species.id && open, // Only fetch when dialog is open

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

    const newRadiusBeingFetched = React.useMemo(() => {
        const newRadii = cumulativeRadii.filter(
            (radius) => !previousCumulativeRadii.includes(radius)
        )
        return newRadii.length > 0 ? newRadii[newRadii.length - 1] : null
    }, [cumulativeRadii, previousCumulativeRadii])

    // Update previous radii when observations data changes (loading completed)
    React.useEffect(() => {
        if (observations && cumulativeRadii.length > 0) {
            setPreviousCumulativeRadii([...cumulativeRadii])
        }
    }, [observations]) // Only depend on observations to avoid loops

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
                        observations={observations}
                        isLoading={isLoading}
                        isError={isError}
                        error={error || undefined}
                        lat={latitude}
                        lon={longitude}
                        locationName={locationName}
                        searchRadius={searchRadius}
                        setSearchRadius={setSearchRadius}
                        showGlobal={showGlobal}
                        setShowGlobal={setShowGlobal}
                        newRadiusBeingFetched={newRadiusBeingFetched}
                        previousCumulativeRadii={previousCumulativeRadii}
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

// Loading skeleton for individual accordion items
function AccordionItemLoadingSkeleton() {
    return (
        <motion.div
            className="pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
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

function ObservationList({
    observations,
    isLoading,
    isError,
    error,
    lat,
    lon,
    locationName,
    searchRadius,
    setSearchRadius,
    showGlobal,
    setShowGlobal,
    newRadiusBeingFetched,
    previousCumulativeRadii,
}: {
    observations?: Observation[]
    isLoading: boolean
    isError: boolean
    error?: Error
    lat?: number
    lon?: number
    locationName?: string
    searchRadius: number
    setSearchRadius: (radius: number) => void
    showGlobal: boolean
    setShowGlobal: (global: boolean) => void
    newRadiusBeingFetched: number | null
    previousCumulativeRadii: number[]
}) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')

    // Ensure coords are numbers and round for stable caching
    const hasValidCoords =
        lat !== undefined &&
        lon !== undefined &&
        !isNaN(Number(lat)) &&
        !isNaN(Number(lon))

    // Get all radii that should be included for cumulative results
    const getCumulativeRadii = (currentRadius: number): number[] => {
        const radii = [20, 100, 1000]
        return radii.filter((radius) => radius <= currentRadius)
    }

    const cumulativeRadii = getCumulativeRadii(searchRadius)

    // Group observations by search radius
    const groupedObservations = React.useMemo(() => {
        if (!observations) return {}

        const groups: Record<number, typeof observations> = {}
        cumulativeRadii.forEach((radius) => {
            groups[radius] = []
        })

        observations.forEach((obs) => {
            if (obs.searchRadius && groups[obs.searchRadius]) {
                groups[obs.searchRadius].push(obs)
            }
        })

        return groups
    }, [observations, cumulativeRadii])

    // Track expanded accordion sections
    const [expandedSections, setExpandedSections] = React.useState<string[]>([])
    const [lastCumulativeRadii, setLastCumulativeRadii] = React.useState<
        number[]
    >([])

    // Update expanded sections when cumulative radii change
    React.useEffect(() => {
        if (cumulativeRadii.length > 0) {
            const mostRecentRadius =
                cumulativeRadii[cumulativeRadii.length - 1].toString()

            // Only auto-expand if the cumulative radii actually changed (not just user interaction)
            if (
                JSON.stringify(cumulativeRadii) !==
                JSON.stringify(lastCumulativeRadii)
            ) {
                setExpandedSections([mostRecentRadius])
                setLastCumulativeRadii([...cumulativeRadii])
            }
        }
    }, [cumulativeRadii, lastCumulativeRadii])

    // Handle accordion expansion changes (user interactions)
    const handleAccordionChange = (value: string[]) => {
        setExpandedSections(value)
    }

    return (
        <div className={`mx-2 mt-2 flex h-full flex-col`}>
            {/* Header / Toggle */}
            <motion.div
                className="flex flex-col flex-shrink-0 mb-2 min-h-12 relative z-20 bg-background rounded-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {/* Title and location row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold">
                            Recent Observations ({observations?.length || 0})
                            {showGlobal && (
                                <span className="text-xs text-green-600 ml-2">
                                    (Global)
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-row items-center">
                            <MdOutlineLocationOn className="mr-1" />
                            {showGlobal
                                ? 'Global observations'
                                : locationName
                                  ? `${locationName}${hasValidCoords ? ` (${searchRadius}km)` : ''}`
                                  : hasValidCoords
                                    ? `${searchRadius}km`
                                    : 'Global observations'}
                        </div>
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between px-0">
                    <div className="flex items-center">
                        {hasValidCoords && !showGlobal && (
                            <ToggleGroup
                                type="single"
                                value={searchRadius.toString()}
                                onValueChange={(value) =>
                                    value && setSearchRadius(parseInt(value))
                                }
                                className="rounded-lg mx-0"
                            >
                                <ToggleGroupItem
                                    value="20"
                                    aria-label="20km radius"
                                >
                                    20km
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="100"
                                    aria-label="100km radius"
                                >
                                    100km
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="1000"
                                    aria-label="1000km radius"
                                >
                                    1000km
                                </ToggleGroupItem>
                            </ToggleGroup>
                        )}
                    </div>
                    <div className="flex items-center">
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(value: ViewMode) =>
                                value && setViewMode(value)
                            }
                            className="border-0 rounded-lg mx-0"
                        >
                            <ToggleGroupItem
                                value="grid"
                                aria-label="Grid view"
                            >
                                <Grid className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                aria-label="List view"
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="map" aria-label="Map view">
                                <MapIcon className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
            </motion.div>

            {/* Content wrapper with constrained height */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full pt-2 pb-6"
                    >
                        {isError ? (
                            <ObservationErrorState error={error} />
                        ) : isLoading ||
                          (observations && observations.length > 0) ? (
                            <div className="space-y-2">
                                {/* Map view - show all observations on single map */}
                                {viewMode === 'map' &&
                                    lat !== undefined &&
                                    lon !== undefined && (
                                        <ObservationMapView
                                            observations={observations || []}
                                            center={[lat, lon]}
                                            searchRadius={searchRadius}
                                            showRadiusBadges={true}
                                        />
                                    )}

                                {/* Accordion for grouped observations (grid and list views only) */}
                                {viewMode !== 'map' && (
                                    <Accordion
                                        type="multiple"
                                        value={expandedSections}
                                        onValueChange={handleAccordionChange}
                                        className="w-full h-full border rounded-lg bg-background p-0 flex flex-col"
                                    >
                                        {cumulativeRadii.map((radius) => {
                                            const radiusObservations =
                                                groupedObservations[radius] ||
                                                []
                                            const isNewRadiusLoading =
                                                isLoading &&
                                                newRadiusBeingFetched === radius
                                            // Keep accordions visible if they have observations OR are currently loading
                                            // OR if they were previously loaded (tracked by previousCumulativeRadii)
                                            // OR if this radius is included in the current cumulative radii (to show loading state)
                                            const shouldShowAccordion =
                                                radiusObservations.length > 0 ||
                                                isNewRadiusLoading ||
                                                (previousCumulativeRadii.includes(
                                                    radius
                                                ) &&
                                                    !isLoading) ||
                                                (cumulativeRadii.includes(
                                                    radius
                                                ) &&
                                                    isLoading)

                                            if (!shouldShowAccordion)
                                                return null

                                            return (
                                                <AccordionItem
                                                    key={radius}
                                                    value={radius.toString()}
                                                    className="border-b last:border-b-0 flex flex-col"
                                                >
                                                    <AccordionTrigger className="hover:no-underline px-4">
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                                                                    radius ===
                                                                    20
                                                                        ? 'bg-blue-500'
                                                                        : radius ===
                                                                            100
                                                                          ? 'bg-green-500'
                                                                          : 'bg-purple-500'
                                                                }`}
                                                            >
                                                                {radius}km
                                                            </span>
                                                            <span className="text-sm font-medium">
                                                                {isNewRadiusLoading
                                                                    ? 'Loading...'
                                                                    : `${radiusObservations.length} observation${radiusObservations.length !== 1 ? 's' : ''}`}
                                                            </span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-4 pb-4 px-4 overflow-y-scrollo flex-1 min-h-0">
                                                        {isNewRadiusLoading ? (
                                                            <AccordionItemLoadingSkeleton />
                                                        ) : viewMode ===
                                                          'grid' ? (
                                                            <ObservationGridView
                                                                observations={
                                                                    radiusObservations
                                                                }
                                                                showRadiusBadges={
                                                                    false
                                                                }
                                                            />
                                                        ) : (
                                                            <ObservationListView
                                                                observations={
                                                                    radiusObservations
                                                                }
                                                                showRadiusBadges={
                                                                    false
                                                                }
                                                            />
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )
                                        })}
                                    </Accordion>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="text-center py-8"
                            >
                                <p className="text-muted-foreground mb-4">
                                    {hasValidCoords && !showGlobal
                                        ? `No observations found for this species within ${cumulativeRadii.join('+')}km combined search.`
                                        : `No observations found for this species globally.`}
                                </p>

                                {hasValidCoords &&
                                    !showGlobal &&
                                    searchRadius < 1000 && (
                                        <div className="flex flex-col gap-3 items-center">
                                            {searchRadius === 20 && (
                                                <button
                                                    onClick={() =>
                                                        setSearchRadius(100)
                                                    }
                                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                                                >
                                                    Expand search to 100km (keep
                                                    existing results)
                                                </button>
                                            )}
                                            {searchRadius === 100 && (
                                                <button
                                                    onClick={() =>
                                                        setSearchRadius(1000)
                                                    }
                                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                                                >
                                                    Expand search to 1000km
                                                    (keep existing results)
                                                </button>
                                            )}
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
                                            setSearchRadius(20)
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
            </div>
        </div>
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
    radius: number = 20,
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

async function getCumulativeObservationsFromINat(
    taxonId: number,
    radii: number[],
    lat?: number,
    lon?: number,
    globalSearch: boolean = false
) {
    try {
        console.log(
            `Fetching cumulative observations for taxon ${taxonId} with radii: ${radii.join(', ')}km`
        )

        // Fetch observations for each radius
        const fetchPromises = radii.map((radius) =>
            getObservationsFromINat(taxonId, lat, lon, radius, globalSearch)
        )

        const resultsArrays = await Promise.all(fetchPromises)

        // Combine all results and deduplicate by ID
        const seenIds = new Set<number>()
        const combinedResults: Observation[] = []

        // Process results in order of increasing radius (so smaller radius results come first)
        for (let i = 0; i < resultsArrays.length; i++) {
            const results = resultsArrays[i]
            const radius = radii[i]

            for (const observation of results) {
                if (!seenIds.has(observation.id)) {
                    seenIds.add(observation.id)
                    // Add radius information to track where this observation came from
                    combinedResults.push({
                        ...observation,
                        searchRadius: radius,
                    })
                }
            }
        }

        console.log(
            `Combined ${combinedResults.length} unique observations from radii: ${radii.join(', ')}km`
        )

        return combinedResults
    } catch (error) {
        console.error(
            `Error fetching cumulative observations for taxon ${taxonId}:`,
            error
        )
        throw error
    }
}
