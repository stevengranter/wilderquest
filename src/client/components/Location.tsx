import { useEffect } from 'react'

interface LocationPromptProps {
    onLocationRetrieved: (
        coords: { latitude: number; longitude: number } | { error: string }
    ) => void
}

export default function LocationPrompt({
    onLocationRetrieved,
}: LocationPromptProps) {
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
            }
        )
    }, [onLocationRetrieved])

    return <div>Requesting location...</div>
}
