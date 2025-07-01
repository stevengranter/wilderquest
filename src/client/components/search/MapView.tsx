import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { data } from 'react-router'
import z from 'zod'
import {
    INatObservation,
    INatObservationsResponse,
} from '../../../shared/types/iNatTypes'

type MapViewProps = {
    data: INatObservationsResponse
    taxonId?: number
    localQuery: string
}

export default function MapView({ data, taxonId, localQuery }: MapViewProps) {
    const [geoData, setGeoData] = useState<INatObservation[]>(null)

    useEffect(() => {
        if (!data?.results) return

        const markers = data.results.filter((result) => {
            if (result.geojson) {
                console.table(result.geojson)
                return true
            }
            return false
        })

        setGeoData(markers)
        console.log('Filtered geoData:', markers)
    }, [data])

    return (
        <MapContainer
            center={[49.192791, -57.40712]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '500px' }}
        >
            {/*Base Layer */}
            <TileLayer
                attribution='Maps &copy <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="/api/tiles/{z}/{x}/{y}.png"
                zIndex={1}
            />

            {/* Markers */}
            {geoData?.map((result) => {
                if (!result.geojson) return null
                return (
                    <Marker
                        key={result.id}
                        position={[
                            result.geojson.coordinates[1],
                            result.geojson.coordinates[0],
                        ]}
                    >
                        <Popup>
                            {result.taxon?.preferred_common_name}
                            <img src={result?.photos[0]?.url} />
                        </Popup>
                    </Marker>
                )
            })}

            {/* Overlay Layer (e.g., heatmap) */}
            <TileLayer
                url={`/api/iNatAPI/heatmap/{z}/{x}/{y}.png?q=${localQuery}`}
                // zIndex={2}
                opacity={0.6} // Optional: Adjust transparency
            />
        </MapContainer>
    )
}
