import axios from 'axios'
import { RequestHandler } from 'express'

const INATURALIST_API_BASE_URL = 'https://api.inaturalist.org/v1'

const iNaturalistAPIController: RequestHandler = async (req, res) => {
    try {
        // req.path is everything *after* /api/inaturalistproxy
        const path = req.path // e.g. /taxa, /observations/12345

        const query = new URLSearchParams(
            req.query as Record<string, string>,
        ).toString()
        const url = `${INATURALIST_API_BASE_URL}${path}${query ? `?${query}` : ''}`

        console.log('Proxying to:', url)

        const response = await axios.get(url)
        res.status(response.status).json(response.data)
    } catch (error) {
        console.error('iNaturalist proxy error:', error)
        res.status(500).json({ error: 'Failed to fetch from iNaturalist API' })
    }
}

export default iNaturalistAPIController
