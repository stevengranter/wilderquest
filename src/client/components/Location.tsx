import { useEffect } from 'react'

export default function LocationPrompt({ onLocationRetrieved }) {
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }
                onLocationRetrieved(coords)
            },
            (error) => {
                onLocationRetrieved({ error: error.message })
            },
        )
    }, [onLocationRetrieved])

    return <div>Requesting location...</div>
}
