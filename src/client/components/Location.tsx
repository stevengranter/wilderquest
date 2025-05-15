import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GeoLocation() {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
    const [error, setError] = useState<string>('')
    const [city, setCity] = useState<string>('')

    useEffect(() => {
        console.log(city)
    }, [city])

    function getGeoLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    })
                    setError('')
                },
                (error) => {
                    setError(error.message)
                },
            )
        } else {
            setError('Geolocation is not supported by this browser.')
        }
    }

    async function requestLocation(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!city) return
        console.log('Submitting city: ', city, '')
        try {
            const encodedCity = encodeURIComponent(city)
            const results = await axios.get(`/api/service/geo/forward?city=${encodedCity}`)
            console.log(results)
            if (results.data && results.data.length > 0) {
                console.log(results)
                setLocation({ latitude: results.data[0].lat, longitude: results.data[0].lon })
            }
        } catch (err) {
            console.error('Failed to fetch location:', err)
            setError('Failed to fetch location')
        }
    }

    return (
        <Card className='p-4 space-y-4'>
            <Button onClick={getGeoLocation}>Get Location</Button>

            {location && (
                <div>
                    Latitude: {location.latitude}, Longitude: {location.longitude}
                </div>
            )}

            <div>or</div>

            <form onSubmit={requestLocation} className='space-y-2'>
                <Input
                    type='text'
                    placeholder='City'
                    name='city'
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                />
                <Button type='submit'>Submit</Button>
            </form>

            {error && <div className='text-red-500'>Error: {error}</div>}
        </Card>
    )
}

export default GeoLocation
