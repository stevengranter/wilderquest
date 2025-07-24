import { LatLngBounds } from 'leaflet'
import React, { useEffect, useState } from 'react'
import {
    MapContainer,
    Marker,
    MarkerProps,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet'

type QuestMapOptions = {
    center?: [number, number]
    zoom?: number
}
type QuestMapProps = {
    options?: QuestMapOptions
    markerData?: MarkerProps[]
}

function MapUpdater({ center }: { center?: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom())
        }
    }, [center, map])
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

export function QuestMapView({ options, markerData }: QuestMapProps) {
    const initialCenter: [number, number] = [49.18, -57.43] // Deer Lake, NL
    const { center, zoom } = options || { center: initialCenter, zoom: 13 }
    const [bounds, setBounds] = useState<LatLngBounds | null>(null)
    const [markers, _setMarkers] = useState<MarkerProps[]>(markerData || [])

    useEffect(() => {
        console.log('Bounds changed:', bounds)
    }, [bounds])

    useEffect(() => {
        console.log('Markers changed:', markers)
    }, [markers])

    return (
        <MapContainer
            center={center || initialCenter}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{
                height: '300px',
                width: '50%',
                aspectRatio: '1/1',
                borderRadius: '8px',
            }}
        >
            <TileLayer
                attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/api/tiles/{z}/{x}/{y}.png"
            />

            {/* Sync bounds with map */}
            <MapSyncHandler onBoundsChange={setBounds} />

            <MapUpdater center={center} />

            {center && (
                <Marker position={center}>
                    <Popup>Selected Quest Location</Popup>
                </Marker>
            )}
        </MapContainer>
    )
}
