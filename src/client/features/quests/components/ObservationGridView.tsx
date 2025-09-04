import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/card'

import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import { useLeaflet } from '@/hooks/useLeaflet'
import { cn } from '@/lib/utils'

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

export interface Observation {
    id: number
    photos: ObservationPhoto[]
    observed_on_string: string
    place_guess: string
    location?: [number, number] // lat, lng coordinates
    geojson?: {
        coordinates: [number, number] // lng, lat (GeoJSON format)
    }
    user: {
        login: string
    }
    searchRadius?: number // Track which radius this observation came from
}

function ProgressiveObservationImage({
    photo,
    className,
}: {
    photo: ObservationPhoto
    className?: string
}) {
    const { src, isBlurred } = useProgressiveImage(
        photo.url,
        photo.url.replace('square', 'medium')
    )

    return (
        <div className={cn('overflow-hidden', className)}>
            <img
                src={src}
                alt="Observation"
                className={cn(
                    'w-full h-full object-cover',
                    isBlurred &&
                        'filter blur-sm scale-110 transition-all duration-500'
                )}
            />
        </div>
    )
}

export function ObservationGridView({
    observations,
    showRadiusBadges = true,
}: {
    observations: Observation[]
    showRadiusBadges?: boolean
}) {
    const observationsWithPhotos = observations.filter(
        (obs) => obs.photos.length > 0
    )

    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <AnimatePresence>
                {observationsWithPhotos.map((obs, index) => {
                    return (
                        <motion.div
                            key={obs.id}
                            initial={{
                                opacity: 0,
                                y: 30,
                                scale: 0.8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -20,
                                scale: 0.8,
                            }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.15,
                                ease: 'easeOut',
                                type: 'spring',
                                damping: 15,
                                stiffness: 100,
                            }}
                            whileTap={{
                                scale: 0.95,
                            }}
                            style={{
                                transformOrigin: 'center center',
                            }}
                        >
                            {/* Polaroid Card */}
                            <div className="bg-white p-3 rounded-lg border-1 hover:shadow-shadow hover:-translate-y-2 transition:shadow duration-300">
                                {/* Photo Area */}
                                <ProgressiveObservationImage
                                    photo={obs.photos[0]}
                                    className="aspect-square bg-gray-100 rounded-sm mb-3"
                                />

                                {/* Polaroid Caption Area */}
                                <div className="flex items-center gap-2">
                                    <p className="font-medium truncate line-clamp-1">
                                        {obs.user.login}
                                    </p>
                                    {obs.searchRadius && showRadiusBadges && (
                                        <span
                                            className={`text-xs px-1.5 py-0.5 rounded-full text-white ${
                                                obs.searchRadius === 20
                                                    ? 'bg-blue-500'
                                                    : obs.searchRadius === 100
                                                      ? 'bg-green-500'
                                                      : 'bg-purple-500'
                                            }`}
                                        >
                                            {obs.searchRadius}km
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-500 line-clamp-1">
                                    {obs.observed_on_string}
                                </p>
                                {obs.place_guess && (
                                    <p className="text-gray-500 truncate text-[10px] line-clamp-1">
                                        📍 {obs.place_guess}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}

// List View Component
export function ObservationListView({
    observations,
    showRadiusBadges = true,
}: {
    observations: Observation[]
    showRadiusBadges?: boolean
}) {
    const observationsWithPhotos = observations.filter(
        (obs) => obs.photos.length > 0
    )

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {observationsWithPhotos.map((obs, index) => (
                    <motion.div
                        key={obs.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                        }}
                        whileHover={{ scale: 1.01 }}
                    >
                        <Card className="p-3">
                            <div className="flex items-center gap-4">
                                {obs.photos.length > 0 && (
                                    <ProgressiveObservationImage
                                        photo={obs.photos[0]}
                                        className="w-16 h-16 rounded-md flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm truncate">
                                            Observed by {obs.user.login}
                                        </p>
                                        {obs.searchRadius &&
                                            showRadiusBadges && (
                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${
                                                        obs.searchRadius === 20
                                                            ? 'bg-blue-500'
                                                            : obs.searchRadius ===
                                                                100
                                                              ? 'bg-green-500'
                                                              : 'bg-purple-500'
                                                    }`}
                                                >
                                                    {obs.searchRadius}km
                                                </span>
                                            )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// Map View Component
export const ObservationMapView = React.memo(function ObservationMapView({
    observations,
    center,
    searchRadius,
    showRadiusBadges = true,
}: {
    observations: Observation[]
    center: [number, number]
    searchRadius: number
    showRadiusBadges?: boolean
}) {
    const { isLoading, error, isLoaded, L } = useLeaflet()

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
        <ObservationMapViewInner
            observations={observations}
            center={center}
            searchRadius={searchRadius}
            showRadiusBadges={showRadiusBadges}
            L={L}
        />
    )
})

// Separate component that uses react-leaflet components
const ObservationMapViewInner = React.memo(function ObservationMapViewInner({
    observations,
    center,
    searchRadius,
    showRadiusBadges,
    L,
}: {
    observations: Observation[]
    center: [number, number]
    searchRadius: number
    showRadiusBadges: boolean
    L: typeof import('leaflet')
}) {
    // Dynamically import react-leaflet components after Leaflet is loaded
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

    // Component to handle dynamic zoom updates
    function MapZoomController() {
        const map = useMap()

        React.useEffect(() => {
            if (map && zoomLevel && map.getZoom() !== zoomLevel) {
                map.setZoom(zoomLevel)
            }
        }, [map, zoomLevel])

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
                zoom={12}
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
                {observationsWithCoords.map((obs) => {
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
                                <div className="max-w-xs">
                                    {obs.photos.length > 0 && (
                                        <img
                                            src={obs.photos[0].url.replace(
                                                'square',
                                                'medium'
                                            )}
                                            alt="Observation"
                                            className="w-full h-32 object-cover rounded mb-2"
                                        />
                                    )}
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm">
                                            Observed by {obs.user.login}
                                        </p>
                                        {obs.searchRadius &&
                                            showRadiusBadges && (
                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded-full text-white ${
                                                        obs.searchRadius === 20
                                                            ? 'bg-blue-500'
                                                            : obs.searchRadius ===
                                                                100
                                                              ? 'bg-green-500'
                                                              : 'bg-purple-500'
                                                    }`}
                                                >
                                                    {obs.searchRadius}km
                                                </span>
                                            )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </motion.div>
    )
})
