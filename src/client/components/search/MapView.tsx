import axios from 'axios'
import { useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useLeaflet } from '@/hooks/useLeaflet'
import getKingdomIcon from '@/components/search/getKingdomIcon'
import {
    INatObservation,
    INatObservationsResponse,
} from '../../../shared/types/iNatTypes'

type MapViewProps = {
    taxonId?: number
    localQuery: string
}

function createKingdomIcon(L: any, kingdom: string) {
    const iconJSX = getKingdomIcon(kingdom) // React component like <FaLeaf />
    const svgString = renderToStaticMarkup(iconJSX)

    return new L.DivIcon({
        className: 'kingdom-marker-icon',
        html: `
            <div class='marker-wrapper'>
                <div class='marker-pin'></div>
                <div class='marker-icon'>${svgString}</div>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50], // Bottom-center of pin aligns to lat/lng
        popupAnchor: [0, -40],
    })
}

export default function MapView({ taxonId, localQuery }: MapViewProps) {
    const { isLoading, error, isLoaded, L } = useLeaflet()
    const [geoData, setGeoData] = useState<INatObservation[]>([])
    const [bounds, setBounds] = useState<any>(null)

    // Fetch when bounds change
    useEffect(() => {
        if (!bounds) return

        const fetchObservations = async () => {
            const sw = bounds.getSouthWest()
            const ne = bounds.getNorthEast()

            const url = `/api/iNatAPI/observations?nelat=${ne.lat}&nelng=${ne.lng}&swlat=${sw.lat}&swlng=${sw.lng}&geo=true&photos=true&verifiable=true&per_page=100&${localQuery ? `q=${localQuery}` : ''}&${taxonId ? `taxon_id=${taxonId}` : ''}`

            try {
                const response = await axios.get<INatObservationsResponse>(url)
                const filtered = response.data.results.filter((r) => r.geojson)
                setGeoData(filtered)
            } catch (err) {
                console.error('Failed to fetch observations:', err)
            }
        }

        fetchObservations()
    }, [bounds, taxonId, localQuery])

    if (error) {
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

    if (isLoading) {
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

    // Dynamically import and render the map components
    return (
        <MapViewInner
            L={L}
            geoData={geoData}
            localQuery={localQuery}
            onBoundsChange={setBounds}
        />
    )
}

// Separate component that uses react-leaflet components
function MapViewInner({
    L,
    geoData,
    localQuery,
    onBoundsChange,
}: {
    L: any
    geoData: INatObservation[]
    localQuery: string
    onBoundsChange: (bounds: any) => void
}) {
    // Dynamically import react-leaflet components after Leaflet is loaded
    const [components, setComponents] = useState<any>(null)

    useEffect(() => {
        // Wait for Leaflet to be available globally before importing react-leaflet
        if (typeof window !== 'undefined' && (window as any).L) {
            import('react-leaflet').then((module) => {
                setComponents(module)
            })
        }
    }, [])

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

    const { MapContainer, Marker, Popup, TileLayer, useMapEvents } = components

    function MapSyncHandler() {
        useMapEvents({
            moveend(e: any) {
                onBoundsChange(e.target.getBounds())
            },
            zoomend(e: any) {
                onBoundsChange(e.target.getBounds())
            },
        })
        return null
    }

    return (
        <MapContainer
            center={[49.192791, -57.40712]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '500px' }}
        >
            <TileLayer
                attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/api/tiles/{z}/{x}/{y}.png"
            />

            <MapSyncHandler />

            {geoData.map((result) => {
                const photo = result?.photos?.[0]?.url
                if (!result.geojson || !photo) return null

                const icon = createKingdomIcon(
                    L,
                    result.taxon?.iconic_taxon_name || 'unknown'
                )

                return (
                    <Marker
                        key={result.id}
                        position={[
                            result.geojson.coordinates[1],
                            result.geojson.coordinates[0],
                        ]}
                        icon={icon}
                    >
                        <Popup>
                            <strong>
                                {result.taxon?.preferred_common_name ||
                                    result.taxon?.name}
                            </strong>
                            <br />
                            <img
                                src={photo}
                                alt="observation"
                                style={{ width: '100px', height: 'auto' }}
                            />
                        </Popup>
                    </Marker>
                )
            })}

            <TileLayer
                url={`/api/iNatAPI/heatmap/{z}/{x}/{y}.png?q=${localQuery}`}
                opacity={0.6}
            />
        </MapContainer>
    )
}
