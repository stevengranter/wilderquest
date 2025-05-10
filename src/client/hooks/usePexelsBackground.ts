import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = 'api/proxy/pexels'

interface PexelsPhoto {
    src: {
        original: string
        landscape: string
    }
}

interface PexelsResponse {
    photos: PexelsPhoto[]
}

export default function usePexelsBackground(
    query: string = 'landscape nature green'
) {
    const { data, isLoading, error } = useQuery<PexelsResponse>({
        queryKey: ['pexelsBackground', query],
        queryFn: async () => {
            const response = await axios.get(
                `${API_URL}?query=${query}&per_page=3`
            )
            return response.data
        },
    })

    useEffect(() => {
        if (data?.photos.length) {
            const randomIndex = Math.floor(Math.random() * data.photos.length)
            const selectedImage = data.photos[randomIndex].src.landscape
            document.body.style.backgroundImage = `url(${selectedImage})`
            document.body.style.backgroundSize = 'cover'
            document.body.style.backgroundPosition = 'center'
        }
    }, [data])

    return { isLoading, error }
}
