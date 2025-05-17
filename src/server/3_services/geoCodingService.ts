import axios from 'axios'

const URL = 'https://us1.locationiq.com/v1/search'
const API_KEY = process.env.LOCATIONIQ_KEY

export async function getForwardGeocode(address: string) {
    const encodedAddress = encodeURIComponent(address)
    const url = `${URL}?key=${API_KEY}&q=${encodedAddress}&format=json`
    try {
        const result = await axios.post(url)
        if (result.status === 200) {
            return result.data
        }
    } catch (error) {
        console.error('Geocoding error:', error)
    }

    return null
}
