import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function GeoLocation() {
    const [location, setLocation] = useState<{ latitude: number, longitude: number }>({ latitude: 0, longitude: 0 })
    const [error, setError] = useState<string>('')

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    })
                },
                (error) => {
                    setError(error.message)
                },
            )
        } else {
            setError('Geolocation is not supported by this browser.')
        }
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!location) {
        return <div>Loading location...</div>
    }

    return (
        <Card className='p-4'>
            <Button onClick={getLocation}>Get Location</Button>
            {location && <div>Latitude: {location?.latitude}, Longitude: {location?.longitude}</div>}
        </Card>
    )
}

export default GeoLocation
