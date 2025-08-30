// src/controllers/iNaturalistAPIController.ts
import axios from 'axios'
import chalk from 'chalk'
import { Request, Response } from 'express'
import { cacheService } from '../services/cache/cacheService.js'
import { globalINaturalistRateLimiter } from '../utils/rateLimiterGlobal.js'
import logger from '../config/logger.js'
import { titleCase } from '../utils/titleCase.js'
import { INatObservation, INatTaxon } from '@shared/types/iNatTypes.js'
import { AppError } from '../middlewares/errorHandler.js'

const INATURALIST_API_BASE_URL = 'https://api.inaturalist.org/v1'

type ProcessableData =
    | INatTaxon
    | INatObservation
    | (INatTaxon | INatObservation)[]

function processINaturalistData(data: ProcessableData): ProcessableData {
    if (Array.isArray(data)) {
        return data.map((item) => processINaturalistData(item)) as (
            | INatTaxon
            | INatObservation
        )[]
    }

    if (data && typeof data === 'object') {
        const processed: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(data)) {
            if (
                (key === 'preferred_common_name' ||
                    key === 'species_guess' ||
                    key === 'common_name') &&
                typeof value === 'string'
            ) {
                processed[key] = titleCase(value)
            } else if (typeof value === 'object' && value !== null) {
                processed[key] = processINaturalistData(
                    value as ProcessableData
                )
            } else {
                processed[key] = value
            }
        }

        return processed as INatTaxon | INatObservation
    }

    return data
}

export const iNaturalistAPIController = async (req: Request, res: Response) => {
    const path = req.path

    // Special endpoint to clear cache
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
        // Stream image response (not caching tiles)
        const imageResponse = await axios.get(url, { responseType: 'stream' })
        res.status(imageResponse.status)
        res.set(imageResponse.headers)
        return imageResponse.data.pipe(res)
    }

    // JSON response
    const jsonResponse = await axios.get<ProcessableData>(url)

    if (jsonResponse.status !== 200) {
        throw new AppError(
            'Failed to fetch data from iNaturalist',
            jsonResponse.status
        )
    }

    const processedData = processINaturalistData(jsonResponse.data)

    // Cache individual taxa from batch responses to improve cache hit rate
    if (
        path.startsWith('/taxa/') &&
        'results' in processedData &&
        Array.isArray(processedData.results)
    ) {
        const taxonIds = path.replace('/taxa/', '').split(',')
        if (taxonIds.length > 1) {
            // Only for batch requests
            for (const taxon of processedData.results) {
                const individualKey = `inat-proxy:${INATURALIST_API_BASE_URL}/taxa/${taxon.id}`
                const individualData = { results: [taxon] }
                await cacheService.set(individualKey, individualData)
            }
            logger.info(
                `🔍 Cached ${processedData.results.length} individual taxa from batch`
            )
        }
    }

    await cacheService.set(cacheKey, processedData)

    logger.info(`🔍 Processed iNaturalist data for path: ${path}`)
    return res.status(200).json(processedData)
}

// Factory function
export const createINaturalistAPIController = () => iNaturalistAPIController
export default iNaturalistAPIController
