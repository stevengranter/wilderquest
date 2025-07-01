import axios from 'axios'
import { RequestHandler } from 'express'

const INATURALIST_API_BASE_URL = 'https://api.inaturalist.org/v1'

export const createINaturalistAPIController = () => {
    return iNaturalistAPIController
}

const iNaturalistAPIController: RequestHandler = async (req, res) => {
    try {
        const path = req.path
        const query = new URLSearchParams(
            req.query as Record<string, string>
        ).toString()
        const url = `${INATURALIST_API_BASE_URL}${path}${query ? `?${query}` : ''}`

        const isTile = path.match(/\.(png|jpg|jpeg|webp)$/)

        console.log('Proxying to:', url)

        if (isTile) {
            // ⛲ Image response (stream)
            const imageResponse = await axios.get(url, {
                responseType: 'stream',
            })
            res.status(imageResponse.status)
            res.set(imageResponse.headers) // preserve content-type, etc.
            imageResponse.data.pipe(res)
        } else {
            // 🧠 JSON response
            const jsonResponse = await axios.get(url)
            res.status(jsonResponse.status).json(jsonResponse.data)
        }
    } catch (error) {
        console.error('iNaturalist proxy error:', error)

        if (axios.isAxiosError(error)) {
            res.status(error.response?.status || 500).json({
                error: 'Failed to fetch from iNaturalist API',
            })
        } else {
            res.status(500).json({ error: 'Unexpected error' })
        }
    }
}

export default iNaturalistAPIController
