import { LatLngBounds } from 'leaflet'
import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, MarkerProps, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'

type QuestMapOptions = {
    center?: [number, number]
    zoom?: number,

}
type QuestMapProps = {
    options?: QuestMapOptions
    markerData?: MarkerProps[]
    style?: React.CSSProperties
    className: string
}

function MapUpdater({ center, zoom }: { center?: [number, number], zoom?: number }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.setView([center[0], center[1]], zoom || 13)
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

export const QuestMapView = React.memo(({ options, markerData, className, style }: QuestMapProps) => {
    const initialCenter: [number, number] = [0, 0]; // World map center
    const initialZoom = 2;

    const center = options?.center;
    const zoom = center ? (options?.zoom || 13) : initialZoom;

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
            className={className}
            style={style}
        >
            <TileLayer
                attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/api/tiles/{z}/{x}/{y}.png"
            />

            {/* Sync bounds with map */}
            <MapSyncHandler onBoundsChange={setBounds} />

            <MapUpdater center={center} zoom={zoom} />

            {center && (
                <Marker position={center}>
                    <Popup>Selected Quest Location</Popup>
                </Marker>
            )}
        </MapContainer>
    )
})
