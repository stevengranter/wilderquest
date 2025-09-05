import axios from 'axios'

export const fetchInatData = async (text: string) => {
    try {
        // Use internal proxy instead of direct API call for rate limiting and caching
        const { data, status, statusText } = await axios.get(
            `http://localhost:3000/api/iNatAPI/taxa?q=${encodeURIComponent(text)}&per_page=20`
        )
        if (statusText !== 'OK') {
            return { source: 'inat', data: `${status} Error: ${statusText}` }
        }
        return { data }
    } catch (error) {
        console.error('Error fetching iNaturalist data:', error)
        return { source: 'inat', data: 'Error fetching data' }
    }
}
