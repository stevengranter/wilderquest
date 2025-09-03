// src/components/search/ObservationMap.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLeaflet } from '@/hooks/useLeaflet'

// Define a type for observation results for better type safety
interface ObservationResult {
    id: number
    species_guess?: string
    place_guess?: string
    latitude?: number
    longitude?: number
    photos?: { url: string }[]
    observed_on?: string
    // Add other properties as needed
}

interface ObservationMapProps {
    observations: ObservationResult[]
}

const ObservationMap: React.FC<ObservationMapProps> = ({ observations }) => {
    const { isLoading, error, isLoaded, L } = useLeaflet()

    if (error) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
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
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                </div>
            </div>
        )
    }

    if (!isLoaded || !L) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                    <p className="text-gray-600">Map not available</p>
                </div>
            </div>
        )
    }

    return <ObservationMapInner observations={observations} L={L} />
}

// Separate component that uses react-leaflet components
function ObservationMapInner({
    observations,
    L,
}: {
    observations: ObservationResult[]
    L: any
}) {
    // Dynamically import react-leaflet components
    const [components, setComponents] = useState<any>(null)

    useEffect(() => {
        import('react-leaflet').then((module) => {
            setComponents(module)
        })
    }, [])

    // Calculate initial map center based on observations or a default
    const initialCenter: [number, number] = useMemo(() => {
        if (
            observations.length > 0 &&
            observations[0].latitude &&
            observations[0].longitude
        ) {
            return [observations[0].latitude, observations[0].longitude]
        }
        // Default center for Clarenville, Newfoundland and Labrador, Canada
        return [48.9189, -53.9871] // Approximate coordinates for Clarenville
    }, [observations])

    // Create a ref for the map instance to adjust bounds later
    const mapRef = useRef<any>(null)

    // Effect to fit bounds when observations change
    useEffect(() => {
        if (mapRef.current && observations.length > 0) {
            const validPoints = observations
                .filter(
                    (obs) =>
                        obs.latitude !== undefined &&
                        obs.longitude !== undefined
                )
                .map((obs) => L.latLng(obs.latitude!, obs.longitude!))

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints)
                mapRef.current.fitBounds(bounds, { padding: [50, 50] }) // Add padding
            }
        }
    }, [observations, L])

    if (!components) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Initializing map...</p>
                </div>
            </div>
        )
    }

    const { MapContainer, Marker, Popup, TileLayer } = components

    return (
        <MapContainer
            center={initialCenter}
            zoom={initialCenter[0] === 48.9189 ? 6 : 10} // Adjust zoom based on whether it's default or observation-specific
            scrollWheelZoom={true}
            className="h-96 w-full rounded shadow-md"
            ref={mapRef} // Assign the ref to MapContainer
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {observations.map((obs) =>
                obs.latitude && obs.longitude ? (
                    <Marker
                        key={obs.id}
                        position={[obs.latitude, obs.longitude]}
                    >
                        <Popup>
                            <strong>
                                {obs.species_guess || 'Unknown Species'}
                            </strong>
                            {obs.place_guess && (
                                <div>Location: {obs.place_guess}</div>
                            )}
                            {obs.observed_on && (
                                <div>
                                    Observed:{' '}
                                    {new Date(
                                        obs.observed_on
                                    ).toLocaleDateString()}
                                </div>
                            )}
                            {obs.photos && obs.photos.length > 0 && (
                                <img
                                    src={obs.photos[0].url}
                                    alt={
                                        obs.species_guess || 'Observation photo'
                                    }
                                    className="w-24 h-auto mt-2 rounded"
                                />
                            )}
                        </Popup>
                    </Marker>
                ) : null
            )}
        </MapContainer>
    )
}

export default ObservationMap
