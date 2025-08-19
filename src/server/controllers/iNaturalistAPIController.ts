import axios from 'axios'
import chalk from 'chalk'
import { RequestHandler } from 'express'
import { cacheService } from '../services/cacheService.js'
import { globalINaturalistRateLimiter } from '../utils/rateLimiterGlobal.js'

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
        const cacheKey = `inat-proxy:${url}`

        // Check cache first
        const cachedData = cacheService.get<any>(cacheKey)
        if (cachedData) {
            console.log(chalk.blue('Serving from cache:', url))
            return res.status(200).json(cachedData)
        }

        const isTile = path.match(/\.(png|jpg|jpeg|webp)$/)

        console.log('Proxying to:', url)

        await globalINaturalistRateLimiter.consume('global')
        const status = await globalINaturalistRateLimiter.get('global')
        console.log(
            chalk.green(`Used: ${10_000 - (status?.remainingPoints ?? 0)}`) +
                ', ' +
                chalk.yellow(`Remaining: ${status?.remainingPoints ?? 0}`)
        )
        const ms = status?.msBeforeNext ?? 0
        const days = ms / 1000 / 60 / 60 / 24
        console.log('Resets in:', days.toFixed(2), 'days')

        if (isTile) {
            // ⛲ Image response (stream) - not caching tiles for now
            const imageResponse = await axios.get(url, {
                responseType: 'stream',
            })
            res.status(imageResponse.status)
            res.set(imageResponse.headers) // preserve content-type, etc.
            imageResponse.data.pipe(res)
        } else {
            // 🧠 JSON response
            const jsonResponse = await axios.get(url)

            // Cache the successful response
            if (jsonResponse.status === 200) {
                cacheService.set(cacheKey, jsonResponse.data)
            }

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
