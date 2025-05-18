import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocalStorage } from '@uidotdev/usehooks'

type Location = { latitude: number, longitude: number }

function GeoLocation() {
    const [localLocation, saveLocalLocation] = useLocalStorage<Location | null>('geoLocation', null)
    const [location, setLocation] = useState<Location | undefined>(localLocation || undefined)
    const [error, setError] = useState<string>('')
    const [city, setCity] = useState<string>('')
    const [resultCity, setResultCity] = useState<string>('')


    useEffect(() => {
        if (!city) return
        console.log(city)
    }, [city])

    useEffect(() => {
        if (!location) return
        saveLocalLocation(location)
    }, [location])

    useEffect(() => {
        if (!localLocation) return
        // console.log(localLocation)
        requestCityFromGeoLocation(localLocation.latitude, localLocation.longitude).then(result => {
            console.log(result)
            setResultCity(result)
        })
    }, [localLocation])

    function getGeoLocationFromBrowser() {
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

    async function requestGeoLocationFromCity(e: React.FormEvent<HTMLFormElement>) {
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

    async function requestCityFromGeoLocation(latitude: number, longitude: number) {
        if (!localLocation) return
        console.log('Lat: ', latitude, 'Long: ', longitude, '')
        try {
            const encodedLatitude = encodeURIComponent(latitude.toString())
            const encodedLongitude = encodeURIComponent(longitude.toString())
            const results = await axios.get(`/api/service/geo/reverse?lat=${encodedLatitude}&lon=${encodedLongitude}`)
            console.log(results)
            if (results.data) {
                console.log(results.data.display_name)
                return results.data.display_name
            }
        } catch (err) {
            console.error('Failed to fetch location:', err)
            setError('Failed to fetch location')
        }
    }

    return (
        <Card className='p-4 space-y-4'>
            <Button onClick={getGeoLocationFromBrowser}>Get Location</Button>

            {location && (
                <div>
                    Latitude: {location.latitude}, Longitude: {location.longitude}
                </div>

            )}
            {localLocation && (
                <div>
                    City (from local location):
                    {resultCity}
                </div>
            )

            }

            <div>or</div>

            <form onSubmit={requestGeoLocationFromCity} className='space-y-2'>
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
