import L, { LatLngBounds } from 'leaflet'
import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, MarkerProps, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { INatObservation, INatTaxon } from '@shared/types/iNatTypes'
import { ClientQuest } from './SpeciesCardWithObservations'
import { QuestMapping } from '../types'
import api from '@/api/api'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'

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
    markerData?: MarkerProps[]
    style?: React.CSSProperties
    className?: string
    questData?: ClientQuest
    taxa?: INatTaxon[]
    mappings?: QuestMapping[]
}

function MapUpdater({
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
            // Fit the world, but respect minZoom (so you don’t zoom out to 0)
            map.fitWorld({ maxZoom: 2 })
        }
    }, [center, zoom, map])

    return null
}

function MapSyncHandler({
    onBoundsChange,
}: {
    onBoundsChange: (bounds: LatLngBounds) => void
}) {
    useMapEvents({
        moveend(e) {
            onBoundsChange(e.target.getBounds())
        },
        zoomend(e) {
            onBoundsChange(e.target.getBounds())
        },
    })
    return null
}

// Create custom marker icon with thumbnail
function createMarkerIcon(photoUrl: string, speciesName: string) {
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
function createFallbackMarkerIcon(speciesName: string, rank: string) {
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
    }: QuestMapProps) => {
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
                        const url = `/iNatAPI/observations?nelat=${ne.lat}&nelng=${ne.lng}&swlat=${sw.lat}&swlng=${sw.lng}&geo=true&photos=true&verifiable=true&per_page=100&taxon_id=${taxonIdsParam}`

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

            // Debounce the API calls
            const timeoutId = setTimeout(fetchObservations, 500)
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
                        icon = createMarkerIcon(obs.photos[0].url, speciesName)
                    } else {
                        icon = createFallbackMarkerIcon(
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
        }, [observations])

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
                    <MapSyncHandler onBoundsChange={setBounds} />
                    <MapUpdater center={center} zoom={zoom} />

                    {/* Quest location marker */}
                    {questData?.latitude &&
                        questData?.longitude &&
                        questData?.name && (
                            <Marker
                                position={[
                                    questData.latitude,
                                    questData.longitude,
                                ]}
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
                                        <Badge
                                            variant="neutral"
                                            className="mt-2"
                                        >
                                            Quest Location
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
                                                marker!.observation
                                                    .species_guess ||
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
                                            src={
                                                marker!.observation.photos[0]
                                                    .url
                                            }
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
                                                By:{' '}
                                                {marker!.observation.user.name}
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
                            <div>
                                Quest: {questData.name || 'Unnamed Quest'}
                            </div>
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
)
