import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useLeaflet } from '@/hooks/useLeaflet'
import { PhotoModal } from './PhotoModal'
import { ObservationCard, type Observation } from './ObservationCard'

interface ObservationMapViewProps {
    observations: Observation[]
    center: [number, number]
    searchRadius: number
    showRadiusBadges?: boolean
}

export const ObservationMapView = React.memo(function ObservationMapView({
    observations,
    center,
    searchRadius,
    showRadiusBadges = true,
}: ObservationMapViewProps) {
    const [photoModalOpen, setPhotoModalOpen] = useState(false)
    const [selectedObservationIndex, setSelectedObservationIndex] = useState(0)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

    const { isLoading, error, isLoaded, L } = useLeaflet()

    const handlePhotoClick = (observationIndex: number, photoIndex: number) => {
        setSelectedObservationIndex(observationIndex)
        setSelectedPhotoIndex(photoIndex)
        setPhotoModalOpen(true)
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-96 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100"
            >
                <div className="text-center">
                    <p className="text-red-600 mb-2">Failed to load map</p>
                    <p className="text-sm text-gray-600">
                        Please try refreshing the page
                    </p>
                </div>
            </motion.div>
        )
    }

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-96 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                </div>
            </motion.div>
        )
    }

    if (!isLoaded || !L) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-96 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100"
            >
                <div className="text-center">
                    <p className="text-gray-600">Map not available</p>
                </div>
            </motion.div>
        )
    }

    return (
        <>
            <ObservationMapViewInner
                observations={observations}
                center={center}
                searchRadius={searchRadius}
                showRadiusBadges={showRadiusBadges}
                L={L}
                onPhotoClick={handlePhotoClick}
            />

            {/* Photo Modal */}
            <PhotoModal
                isOpen={photoModalOpen}
                onClose={() => setPhotoModalOpen(false)}
                observations={observations.filter(
                    (obs) => obs.photos.length > 0
                )}
                initialObservationIndex={selectedObservationIndex}
                initialPhotoIndex={selectedPhotoIndex}
            />
        </>
    )
})

// Separate component that uses react-leaflet components
const ObservationMapViewInner = React.memo(function ObservationMapViewInner({
    observations,
    center,
    searchRadius,
    showRadiusBadges,
    L,
    onPhotoClick,
}: {
    observations: Observation[]
    center: [number, number]
    searchRadius: number
    showRadiusBadges: boolean
    L: typeof import('leaflet')
    onPhotoClick: (observationIndex: number, photoIndex: number) => void
}) {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic import of react-leaflet components requires any for type safety
    const [components, setComponents] = useState<Record<string, any> | null>(
        null
    )

    React.useEffect(() => {
        // Wait for Leaflet to be available globally before importing react-leaflet
        if (typeof window !== 'undefined' && window.L) {
            import('react-leaflet').then((module) => {
                setComponents(module)
            })
        }
    }, [])

    // Filter observations that have coordinates
    const observationsWithCoords = observations.filter(
        (obs) => obs.geojson?.coordinates || obs.location
    )

    if (!components) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full h-96 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Initializing map...</p>
                </div>
            </motion.div>
        )
    }

    const { MapContainer, Marker, Popup, TileLayer, useMap } = components

    // Calculate zoom level based on search radius
    const getZoomForRadius = (radius: number): number => {
        // Approximate zoom levels for different radii (in km)
        if (radius <= 20) return 12 // ~4km visible radius
        if (radius <= 50) return 10 // ~16km visible radius
        if (radius <= 100) return 9 // ~32km visible radius
        if (radius <= 200) return 8 // ~64km visible radius
        if (radius <= 500) return 7 // ~128km visible radius
        if (radius <= 1000) return 6 // ~256km visible radius
        return 5 // >1000km, ~512km visible radius
    }

    const zoomLevel = getZoomForRadius(searchRadius)

    // Component to handle dynamic zoom updates with smooth animation
    function MapZoomController() {
        const map = useMap()

        React.useEffect(() => {
            if (map && zoomLevel && map.getZoom() !== zoomLevel) {
                // Use flyTo for smooth animated zoom transition
                map.flyTo(center, zoomLevel, {
                    duration: 1.5, // Animation duration in seconds
                    easeLinearity: 0.25, // Easing curve (lower = more easing)
                })
            }
        }, [map, zoomLevel, center])

        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-96 rounded-lg overflow-hidden border"
        >
            <MapContainer
                center={center}
                zoom={zoomLevel}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <MapZoomController />
                <TileLayer
                    attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="/api/tiles/{z}/{x}/{y}.png"
                />

                {/* Quest center marker */}
                <Marker position={center}>
                    <Popup>Quest Location</Popup>
                </Marker>

                {/* Observation markers */}
                {observationsWithCoords.map((obs, obsIndex) => {
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
                                <ObservationCard
                                    observation={obs}
                                    showRadiusBadges={showRadiusBadges}
                                    onPhotoClick={onPhotoClick}
                                    observationIndex={obsIndex}
                                    variant="map"
                                />
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </motion.div>
    )
})
