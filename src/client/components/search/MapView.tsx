import axios from 'axios'
import { LatLngBounds } from 'leaflet'
import { useEffect, useState } from 'react'
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMapEvents,
} from 'react-leaflet'
import {
    INatObservation,
    INatObservationsResponse,
} from '../../../shared/types/iNatTypes'

type MapViewProps = {
    taxonId?: number
    localQuery: string
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

export default function MapView({ taxonId, localQuery }: MapViewProps) {
    const [geoData, setGeoData] = useState<INatObservation[]>([])
    const [bounds, setBounds] = useState<LatLngBounds | null>(null)

    // Fetch when bounds change
    useEffect(() => {
        if (!bounds) return

        const fetchObservations = async () => {
            const sw = bounds.getSouthWest()
            const ne = bounds.getNorthEast()

            // const _bbox = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`

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

    return (
        <MapContainer
            // TODO: Set these coords from user-specified location
            center={[49.192791, -57.40712]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '500px' }}
        >
            <TileLayer
                attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/api/tiles/{z}/{x}/{y}.png"
                zIndex={1}
            />

            {/* Sync bounds with map */}
            <MapSyncHandler onBoundsChange={setBounds} />

            {/* Markers */}
            {geoData.map(
                (result) =>
                    result.geojson && (
                        <Marker
                            key={result.id}
                            position={[
                                result.geojson.coordinates[1],
                                result.geojson.coordinates[0],
                            ]}
                        >
                            <Popup>
                                <strong>
                                    {result.taxon?.preferred_common_name ||
                                        result.taxon?.name}
                                </strong>
                                <br />
                                <img
                                    src={result?.photos?.[0]?.url}
                                    alt="observation"
                                    style={{ width: '100px', height: 'auto' }}
                                />
                            </Popup>
                        </Marker>
                    )
            )}

            {/* Optional overlay */}
            <TileLayer
                url={`/api/iNatAPI/heatmap/{z}/{x}/{y}.png?q=${localQuery}`}
                opacity={0.6}
            />
        </MapContainer>
    )
}
