import axios from 'axios'

export const fetchInatData = async (text: string) => {
    const { data, status, statusText } = await axios.get(
        'https://api.inaturalist.org/v1/taxa/?q=' + text
    )
    if (statusText !== 'OK') {
        return { source: 'inat', data: `${status} Error: ${statusText}` }
    }
    return { data }
}
