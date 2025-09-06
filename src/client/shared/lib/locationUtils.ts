import axios from 'axios'
import { LocationIQResults } from '@shared/types'
import { clientDebug } from '@shared/utils/debug'

function isValidLatLng(latitude: number, longitude: number) {
    const isLatValid = latitude >= -90 && latitude <= 90
    const isLngValid = longitude >= -180 && longitude <= 180
    return isLatValid && isLngValid
}

export async function getCitySuggestions(
    city: string
): Promise<LocationIQResults | undefined> {
    clientDebug.general('Submitting city: ', city, '')
    try {
        const encodedCity = encodeURIComponent(city)
        const results = await axios.get<LocationIQResults>(
            `/api/service/geo/forward?city=${encodedCity}`
        )
        if (results.data && results.data.length > 0) {
            clientDebug.general('Received results: ')
            clientDebug.general('Results data:', results.data)
            return results.data
        }
        clientDebug.general('No results found for city:', city)
        return undefined
    } catch (err) {
        clientDebug.general('Failed to fetch location:', err)
        return undefined
    }
}

export async function requestCityFromGeoLocation(
    latitude: number,
    longitude: number
) {
    if (!isValidLatLng(latitude, longitude))
        throw new Error('Invalid latitude or longitude')

    try {
        const encodedLatitude = encodeURIComponent(latitude.toString())
        const encodedLongitude = encodeURIComponent(longitude.toString())
        const results = await axios.get(
            `/api/service/geo/reverse?lat=${encodedLatitude}&lon=${encodedLongitude}`
        )
        clientDebug.general('Reverse geocoding results:', results)
        if (results.data) {
            clientDebug.general('Display name:', results.data.display_name)
            return results.data.display_name
        }
    } catch (err) {
        clientDebug.general('Failed to fetch location:', err)
        throw new Error('Failed to fetch location')
    }
}

export function getGeoLocationFromBrowser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                return {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }
            },
            (error) => {
                throw new Error(error.message)
            }
        )
    } else {
        throw new Error('Geolocation is not supported by this browser.')
    }
}
