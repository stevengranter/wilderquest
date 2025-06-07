// src/components/search/ObservationMap.tsx
import React, { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css' // Import Leaflet's CSS
import L from 'leaflet' // Import Leaflet library itself

// Fix default marker icon issues with Webpack/Vite
// This is a common workaround for Leaflet's default marker icon paths.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
    iconUrl: 'leaflet/images/marker-icon.png',
    shadowUrl: 'leaflet/images/marker-shadow.png',
})

// Define a type for observation results for better type safety
interface ObservationResult {
    id: number;
    species_guess?: string;
    place_guess?: string;
    latitude?: number;
    longitude?: number;
    photos?: { url: string }[];
    // Add other properties as needed
}

interface ObservationMapProps {
    observations: ObservationResult[];
}

const ObservationMap: React.FC<ObservationMapProps> = ({ observations }) => {
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
    const mapRef = useRef<L.Map>(null)

    // Effect to fit bounds when observations change
    useEffect(() => {
        if (mapRef.current && observations.length > 0) {
            const validPoints = observations
                .filter(
                    (obs) => obs.latitude !== undefined && obs.longitude !== undefined,
                )
                .map((obs) => L.latLng(obs.latitude!, obs.longitude!))

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints)
                mapRef.current.fitBounds(bounds, { padding: [50, 50] }) // Add padding
            }
        }
    }, [observations])

    return (
        <MapContainer
            center={initialCenter}
            zoom={initialCenter[0] === 48.9189 ? 6 : 10} // Adjust zoom based on whether it's default or observation-specific
            scrollWheelZoom={true}
            className='h-96 w-full rounded shadow-md'
            ref={mapRef} // Assign the ref to MapContainer
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {observations.map((obs) =>
                obs.latitude && obs.longitude ? (
                    <Marker key={obs.id} position={[obs.latitude, obs.longitude]}>
                        <Popup>
                            <strong>{obs.species_guess || 'Unknown Species'}</strong>
                            {obs.place_guess && <div>Location: {obs.place_guess}</div>}
                            {obs.observed_on && (
                                <div>
                                    Observed: {new Date(obs.observed_on).toLocaleDateString()}
                                </div>
                            )}
                            {obs.photos && obs.photos.length > 0 && (
                                <img
                                    src={obs.photos[0].url}
                                    alt={obs.species_guess || 'Observation photo'}
                                    className='w-24 h-auto mt-2 rounded'
                                />
                            )}
                        </Popup>
                    </Marker>
                ) : null,
            )}
        </MapContainer>
    )
}

export default ObservationMap
