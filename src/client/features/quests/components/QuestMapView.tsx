import React, { useEffect, useMemo, useState } from 'react'
import { INatObservation, INatTaxon } from '@shared/types/iNatTypes'
import type { Map as LeafletMap, LatLngBounds, LeafletEvent } from 'leaflet'
import { ClientQuest } from './SpeciesCardWithObservations'
import { QuestMapping } from '../types'
import api from '@/api/api'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'
import { useLeaflet } from '@/hooks/useLeaflet'

// Add custom CSS for markers
const markerStyles = `
    .custom-marker-container {
        background: transparent !important;
        border: none !important;
    }
    
    .custom-marker-fallback-container {
        background: transparent !important;
        border: none !important;
    }
    
    .custom-marker, .custom-marker-fallback {
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .custom-marker:hover, .custom-marker-fallback:hover {
        transform: scale(1.1);
        z-index: 500;
    }
    
    .custom-marker img {
        transition: filter 0.2s ease;
    }
    
    .custom-marker:hover img {
        filter: brightness(1.1);
    }
`

// Inject styles into the document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style')
    styleElement.textContent = markerStyles
    document.head.appendChild(styleElement)
}

type QuestMapOptions = {
    center?: [number, number]
    zoom?: number
}

type QuestMapProps = {
    options?: QuestMapOptions
    markerData?: INatObservation[]
    style?: React.CSSProperties
    className?: string
    questData?: ClientQuest
    taxa?: INatTaxon[]
    mappings?: QuestMapping[]
    questLocation?: {
        latitude: number
        longitude: number
        name?: string
        locationName?: string
    }
}

// Helper functions that will be used with dynamically loaded components
// (Removed createMapUpdater and createMapSyncHandler - now defined inline)

// Create custom marker icon with thumbnail
function createMarkerIcon(
    L: typeof import('leaflet'),
    photoUrl: string,
    speciesName: string
) {
    const iconSize = [40, 40] as [number, number]
    const iconAnchor = [20, 40] as [number, number]

    // Create a custom HTML element for the marker
    const div = document.createElement('div')
    div.className = 'custom-marker'
    div.innerHTML = `
        <div style="
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            background: white;
        ">
            <img
                src="${photoUrl}"
                alt="${speciesName}"
                style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                "
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div style="
                display: none;
                width: 100%;
                height: 100%;
                background: #f3f4f6;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #6b7280;
                text-align: center;
                padding: 2px;
            ">
                ${speciesName.split(' ')[0].substring(0, 3)}
            </div>
        </div>
        <div style="
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 10;
        ">
            ${speciesName.length > 12 ? speciesName.substring(0, 10) + '...' : speciesName}
        </div>
    `

    return L.divIcon({
        html: div,
        className: 'custom-marker-container',
        iconSize,
        iconAnchor,
        popupAnchor: [0, -40],
    })
}

// Create fallback marker icon for species without photos
function createFallbackMarkerIcon(
    L: typeof import('leaflet'),
    speciesName: string,
    rank: string
) {
    const iconSize = [40, 40] as [number, number]
    const iconAnchor = [20, 40] as [number, number]

    const div = document.createElement('div')
    div.className = 'custom-marker-fallback'
    div.innerHTML = `
        <div style="
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, #10b981, #059669);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        ">
            ${rank === 'species' ? 'S' : rank === 'genus' ? 'G' : rank === 'family' ? 'F' : 'T'}
        </div>
        <div style="
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 10;
        ">
            ${speciesName.length > 12 ? speciesName.substring(0, 10) + '...' : speciesName}
        </div>
    `

    return L.divIcon({
        html: div,
        className: 'custom-marker-fallback-container',
        iconSize,
        iconAnchor,
        popupAnchor: [0, -40],
    })
}

export const QuestMapView = React.memo(
    ({
        options,
        markerData,
        className,
        style,
        questData,
        taxa,
        mappings,
        questLocation,
    }: QuestMapProps) => {
        const {
            isLoading: leafletLoading,
            error: leafletError,
            isLoaded,
            L,
        } = useLeaflet()

        if (leafletError) {
            return (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <p className="text-red-600 mb-2">Failed to load map</p>
                        <p className="text-sm text-gray-600">
                            Please try refreshing the page
                        </p>
                    </div>
                </div>
            )
        }

        if (leafletLoading) {
            return (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading map...</p>
                    </div>
                </div>
            )
        }

        if (!isLoaded || !L) {
            return (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <p className="text-gray-600">Map not available</p>
                    </div>
                </div>
            )
        }

        return (
            <QuestMapViewInner
                L={L}
                options={options}
                markerData={markerData}
                className={className}
                style={style}
                questData={questData}
                taxa={taxa}
                mappings={mappings}
                questLocation={questLocation}
            />
        )
    }
)

// Separate component that uses react-leaflet components
function QuestMapViewInner({
    L,
    options,
    markerData,
    className,
    style,
    questData,
    taxa,
    mappings,
    questLocation,
}: QuestMapProps & { L: typeof import('leaflet') }) {
    // Dynamically import react-leaflet components after Leaflet is loaded
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic import of react-leaflet components requires any for type safety
    const [components, setComponents] = useState<Record<string, any> | null>(
        null
    )

    useEffect(() => {
        // Wait for Leaflet to be available globally before importing react-leaflet
        if (typeof window !== 'undefined' && window.L) {
            import('react-leaflet').then((module) => {
                setComponents(module)
            })
        }
    }, [])

    const [observations, setObservations] = useState<INatObservation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [bounds, setBounds] = useState<LatLngBounds | null>(null)

    // Remove [0,0] default here
    const initialCenter: [number, number] | undefined = useMemo(() => {
        if (questData?.latitude && questData?.longitude) {
            return [questData.latitude, questData.longitude]
        }
        if (options?.center) {
            return options.center
        }
        return undefined // triggers fitWorld()
    }, [questData?.latitude, questData?.longitude, options?.center])

    const initialZoom = questData?.latitude
        ? 13
        : options?.center
          ? 13
          : undefined

    const center = options?.center || initialCenter
    const zoom = options?.zoom || initialZoom

    // Fetch observations when bounds change or taxa change
    useEffect(() => {
        if (!bounds || !taxa || taxa.length === 0) return

        const fetchObservations = async () => {
            setIsLoading(true)
            try {
                const sw = bounds.getSouthWest()
                const ne = bounds.getNorthEast()

                // Only fetch if the bounds are reasonable (not too large)
                const latDiff = Math.abs(ne.lat - sw.lat)
                const lngDiff = Math.abs(ne.lng - sw.lng)

                // Skip if bounds are too large (entire world or continent)
                if (latDiff > 50 || lngDiff > 50) {
                    console.log(
                        'Skipping observation fetch - bounds too large:',
                        { latDiff, lngDiff }
                    )
                    setObservations([])
                    setIsLoading(false)
                    return
                }

                // Batch taxa IDs to minimize API calls
                const taxonIds = taxa.map((t) => t.id)
                const batchSize = 30 // iNaturalist API batch limit
                const batches = []

                for (let i = 0; i < taxonIds.length; i += batchSize) {
                    batches.push(taxonIds.slice(i, i + batchSize))
                }

                // Fetch observations for each batch of taxa
                const allObservations: INatObservation[] = []

                for (const batch of batches) {
                    const taxonIdsParam = batch.join(',')
                    const url = `/iNatAPI/observations?nelat=${ne.lat}&nelng=${ne.lng}&swlat=${sw.lat}&swlng=${sw.lng}&geo=true&photos=true&verifiable=true&per_page=50&taxon_id=${taxonIdsParam}`

                    try {
                        const response = await api.get(url)
                        const filtered = response.data.results.filter(
                            (r: INatObservation) => r.geojson
                        )
                        allObservations.push(...filtered)
                    } catch (error) {
                        console.error(
                            'Failed to fetch observations for batch:',
                            batch,
                            error
                        )
                    }
                }

                setObservations(allObservations)
            } catch (error) {
                console.error('Failed to fetch observations:', error)
            } finally {
                setIsLoading(false)
            }
        }

        // Increase debounce time and add bounds stability check
        const timeoutId = setTimeout(fetchObservations, 1000) // Increased from 500ms
        return () => clearTimeout(timeoutId)
    }, [bounds, taxa])

    // Create markers from observations with custom icons
    const markers = useMemo(() => {
        return observations
            .map((obs) => {
                if (!obs.geojson) return null

                const speciesName =
                    obs.taxon?.preferred_common_name ||
                    obs.species_guess ||
                    obs.taxon?.name ||
                    'Unknown Species'

                let icon
                if (obs.photos?.[0]?.url) {
                    icon = createMarkerIcon(L, obs.photos[0].url, speciesName)
                } else {
                    icon = createFallbackMarkerIcon(
                        L,
                        speciesName,
                        obs.taxon?.rank || 'species'
                    )
                }

                return {
                    position: [
                        obs.geojson.coordinates[1],
                        obs.geojson.coordinates[0],
                    ] as [number, number],
                    key: obs.id,
                    observation: obs,
                    icon,
                }
            })
            .filter(Boolean)
    }, [observations, L])

    const { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } =
        components || {}

    // Memoize the MapUpdater component - always call useMemo to maintain hook order
    const MapUpdater = useMemo(() => {
        if (!components || !useMap) return () => null

        return function MapUpdaterComponent({
            center,
            zoom,
        }: {
            center?: [number, number]
            zoom?: number
        }) {
            const map = useMap()

            useEffect(() => {
                if (center) {
                    map.setView([center[0], center[1]], zoom || 3)
                } else {
                    map.fitWorld({ maxZoom: 2 })
                }
            }, [center, zoom, map])

            return null
        }
    }, [components, useMap])

    // Memoize the MapSyncHandler component - always call useMemo to maintain hook order
    const MapSyncHandler = useMemo(() => {
        if (!components || !useMapEvents) return () => null

        return function MapSyncHandlerComponent({
            onBoundsChange,
            currentBounds,
        }: {
            onBoundsChange: (bounds: LatLngBounds) => void
            currentBounds: LatLngBounds | null
        }) {
            const events = useMemo(
                () => ({
                    moveend(e: LeafletEvent) {
                        const newBounds = e.target.getBounds()
                        if (
                            !currentBounds ||
                            !newBounds.equals(currentBounds)
                        ) {
                            onBoundsChange(newBounds)
                        }
                    },
                    zoomend(e: LeafletEvent) {
                        const newBounds = e.target.getBounds()
                        if (
                            !currentBounds ||
                            !newBounds.equals(currentBounds)
                        ) {
                            onBoundsChange(newBounds)
                        }
                    },
                }),
                [onBoundsChange, currentBounds]
            )

            useMapEvents(events)
            return null
        }
    }, [components, useMapEvents])

    if (!components) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Initializing map...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full min-h-[400px] z-0">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                className={className || 'w-full h-full min-h-[400px]'}
                style={style}
                minZoom={2} // ⬅️ prevents zooming out too far
                worldCopyJump={false} // ⬅️ disables repeated world copies when panning
                maxBounds={[
                    [-90, -180],
                    [90, 180],
                ]} // ⬅️ clamps to the actual world
            >
                <TileLayer
                    attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="/api/tiles/{z}/{x}/{y}.png"
                />

                {/* Sync bounds with map */}
                <MapSyncHandler
                    onBoundsChange={setBounds}
                    currentBounds={bounds}
                />
                <MapUpdater center={center} zoom={zoom} />

                {/* Quest location marker */}
                {questData?.latitude &&
                    questData?.longitude &&
                    questData?.name && (
                        <Marker
                            position={[questData.latitude, questData.longitude]}
                        >
                            <Popup>
                                <div className="text-center">
                                    <h3 className="font-semibold">
                                        {questData.name}
                                    </h3>
                                    {questData.location_name && (
                                        <p className="text-sm text-gray-600">
                                            {questData.location_name}
                                        </p>
                                    )}
                                    <Badge variant="neutral" className="mt-2">
                                        Quest Location
                                    </Badge>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                {/* Form quest location marker */}
                {questLocation?.latitude && questLocation?.longitude && (
                    <Marker
                        position={[
                            questLocation.latitude,
                            questLocation.longitude,
                        ]}
                    >
                        <Popup>
                            <div className="text-center">
                                <h3 className="font-semibold">
                                    {questLocation.name || 'Quest Location'}
                                </h3>
                                {questLocation.locationName && (
                                    <p className="text-sm text-gray-600">
                                        {questLocation.locationName}
                                    </p>
                                )}
                                <Badge variant="neutral" className="mt-2">
                                    Selected Location
                                </Badge>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Observation markers with custom icons */}
                {markers.map((marker) => (
                    <Marker
                        key={marker!.key}
                        position={marker!.position}
                        icon={marker!.icon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                        {marker!.observation.taxon
                                            ?.preferred_common_name ||
                                            marker!.observation.species_guess ||
                                            'Unknown Species'}
                                    </h4>
                                    {marker!.observation.taxon && (
                                        <Badge
                                            variant="neutral"
                                            className="text-xs"
                                        >
                                            {marker!.observation.taxon.rank}
                                        </Badge>
                                    )}
                                </div>

                                {marker!.observation.photos?.[0]?.url && (
                                    <img
                                        src={marker!.observation.photos[0].url}
                                        alt="observation"
                                        className="w-full h-32 object-cover rounded mb-2"
                                    />
                                )}

                                <div className="space-y-1 text-sm text-gray-600">
                                    {marker!.observation.observed_on && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(
                                                    marker!.observation
                                                        .observed_on
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    {marker!.observation.place_guess && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>
                                                {
                                                    marker!.observation
                                                        .place_guess
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {marker!.observation.user?.name && (
                                        <p>
                                            By: {marker!.observation.user.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">
                            Loading observations...
                        </span>
                    </div>
                </div>
            )}

            {/* Stats */}
            {questData && (
                <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
                    <div className="text-sm text-gray-600">
                        <div>Quest: {questData.name || 'Unnamed Quest'}</div>
                        <div>Taxa: {taxa?.length || 0}</div>
                        <div>Observations: {observations.length}</div>
                    </div>
                </div>
            )}

            {/* Legend */}
            {taxa && taxa.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                        Legend
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300 shadow-sm"></div>
                            <span>Quest Location</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm"></div>
                            <span>Species (no photo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300 shadow-sm"></div>
                            <span>Species (with photo)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
