import axios from 'axios'
import chalk from 'chalk'
import { RequestHandler } from 'express'
import { cacheService } from '../services/cache/cacheService.js'
import { globalINaturalistRateLimiter } from '../utils/rateLimiterGlobal.js'
import logger from '../config/logger.js'
import { titleCase } from '../utils/titleCase.js'
import { INatObservation, INatTaxon } from '@shared/types/iNatTypes.js'

const INATURALIST_API_BASE_URL = 'https://api.inaturalist.org/v1'

// Type for the data that can be processed
type ProcessableData = INatTaxon | INatObservation | (INatTaxon | INatObservation)[]

// Function to recursively process iNaturalist data and format preferred_common_name fields
function processINaturalistData(data: ProcessableData): ProcessableData {
    if (Array.isArray(data)) {
        return data.map(item => processINaturalistData(item)) as (INatTaxon | INatObservation)[]
    }

    if (data && typeof data === 'object') {
        const processed: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(data)) {
            if ((key === 'preferred_common_name' || key === 'species_guess' || key === 'common_name') && typeof value === 'string') {
                processed[key] = titleCase(value)
            } else if (typeof value === 'object' && value !== null) {
                processed[key] = processINaturalistData(value as ProcessableData)
            } else {
                processed[key] = value
            }
        }

        return processed as INatTaxon | INatObservation
    }

    return data
}

export const createINaturalistAPIController = () => {
    return iNaturalistAPIController
}

const iNaturalistAPIController: RequestHandler = async (req, res) => {
    try {
        const path = req.path

        // Add a special endpoint to clear cache for testing
        if (path === '/clear-cache' && req.method === 'POST') {
            await cacheService.flush()
            return res.status(200).json({ message: 'Cache cleared successfully' })
        }

        const query = new URLSearchParams(
            req.query as Record<string, string>
        ).toString()
        const url = `${INATURALIST_API_BASE_URL}${path}${query ? `?${query}` : ''}`
        const cacheKey = `inat-proxy:${url}`

        // Check cache first
        const cachedData = await cacheService.get<ProcessableData>(cacheKey)
        if (cachedData) {
            logger.info(chalk.blue('Serving from cache:', url))
            return res.status(200).json(cachedData)
        }

        const isTile = path.match(/\.(png|jpg|jpeg|webp)$/)

        logger.info('Proxying to:', url)

        await globalINaturalistRateLimiter.consume('global')
        const status = await globalINaturalistRateLimiter.get('global')
        logger.info(
            chalk.green(`Used: ${10_000 - (status?.remainingPoints ?? 0)}`) +
            ', ' +
            chalk.yellow(`Remaining: ${status?.remainingPoints ?? 0}`)
        )
        const ms = status?.msBeforeNext ?? 0
        const days = ms / 1000 / 60 / 60 / 24
        logger.info('Resets in:', days.toFixed(2), 'days')

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
            const jsonResponse = await axios.get<ProcessableData>(url)

            // Process the data to format preferred_common_name fields
            if (jsonResponse.status === 200) {
                console.log(`🔍 Processing iNaturalist data for path: ${path}`)
                console.log(`📊 Data type: ${Array.isArray(jsonResponse.data) ? 'Array' : 'Object'}`)
                if (Array.isArray(jsonResponse.data)) {
                    console.log(`📊 Array length: ${jsonResponse.data.length}`)
                }
                const processedData = processINaturalistData(jsonResponse.data)

                // Cache the processed response
                await cacheService.set(cacheKey, processedData)

                res.status(jsonResponse.status).json(processedData)
            } else {
                res.status(jsonResponse.status).json(jsonResponse.data)
            }
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