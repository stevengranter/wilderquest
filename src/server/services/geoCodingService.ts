import axios from 'axios'

const URL = 'https://us1.locationiq.com/v1'
const API_KEY = process.env.LOCATIONIQ_KEY

export async function getForwardGeocode(address: string) {
    const encodedAddress = encodeURIComponent(address)
    const url = `${URL}/search?key=${API_KEY}&q=${encodedAddress}&format=json&addressdetails=1&normalizeaddress=1`
    try {
        const result = await axios.post(url)
        if (result.status === 200) {
            return result.data
        }
    } catch (error) {
        console.log('API:', 'Forward geocoding error: %o', error)
    }

    return null
}

export async function getReverseGeocode(latitude: string, longitude: string) {
    const encodedLatitude = encodeURIComponent(latitude)
    const encodedLongitude = encodeURIComponent(longitude)
    console.log('API:', 'Reverse geocode: lat=%s, lng=%s', latitude, longitude)
    const url = `${URL}/reverse?key=${API_KEY}&lat=${encodedLatitude}&lon=${encodedLongitude}&format=json&addressdetails=1&normalizeaddress=1`
    try {
        const result = await axios.post(url)
        if (result.status === 200) {
            return result.data
        }
    } catch (error) {
        console.log('API:', 'Reverse geocoding error: %o', error)
    }

    return null
}
