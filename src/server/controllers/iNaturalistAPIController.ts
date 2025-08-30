// src/controllers/iNaturalistAPIController.ts
import axios from 'axios'
import chalk from 'chalk'
import { Request, Response } from 'express'
import { cacheService } from '../services/cache/cacheService.js'
import { globalINaturalistRateLimiter } from '../utils/rateLimiterGlobal.js'
import { getWithRetry } from '../utils/retryWithBackoff.js'
import logger from '../config/logger.js'
import { titleCase } from '../utils/titleCase.js'
import { INatObservation, INatTaxon } from '@shared/types/iNatTypes.js'
import { AppError } from '../middlewares/errorHandler.js'

const INATURALIST_API_BASE_URL = 'https://api.inaturalist.org/v1'

type ProcessableData =
    | INatTaxon
    | INatObservation
    | (INatTaxon | INatObservation)[]
    | { results: INatTaxon[]; total_results?: number; page?: number }
    | { results: INatObservation[]; total_results?: number; page?: number }

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

    // Special handling for taxa batch requests - check cache for individual taxa
    let finalProcessedData: ProcessableData
    let shouldCacheBatch = true

    if (path.startsWith('/taxa/')) {
        const taxonIds = path
            .replace('/taxa/', '')
            .split(',')
            .filter((id) => id.trim())
        if (taxonIds.length > 1) {
            // This is a batch request - check individual cache entries
            const cachedTaxa: INatTaxon[] = []
            const uncachedTaxonIds: string[] = []

            for (const taxonId of taxonIds) {
                const individualKey = `inat-proxy:${INATURALIST_API_BASE_URL}/taxa/${taxonId}`
                const cachedTaxonData = await cacheService.get<{
                    results: INatTaxon[]
                }>(individualKey)
                if (
                    cachedTaxonData &&
                    cachedTaxonData.results &&
                    cachedTaxonData.results.length > 0
                ) {
                    cachedTaxa.push(cachedTaxonData.results[0])
                } else {
                    uncachedTaxonIds.push(taxonId)
                }
            }

            if (uncachedTaxonIds.length === 0) {
                // All taxa were cached - return combined result
                finalProcessedData = { results: cachedTaxa }
                shouldCacheBatch = false
                logger.info(
                    `🔍 Served ${cachedTaxa.length} taxa entirely from cache`
                )
            } else if (uncachedTaxonIds.length < taxonIds.length) {
                // Partial cache hit - fetch only uncached taxa
                const partialUrl = `${INATURALIST_API_BASE_URL}/taxa/${uncachedTaxonIds.join(',')}${query ? `?${query}` : ''}`
                logger.info(
                    `🔍 Fetching ${uncachedTaxonIds.length} uncached taxa, ${cachedTaxa.length} from cache`
                )

                const partialResponse =
                    await getWithRetry<ProcessableData>(partialUrl)
                if (partialResponse.status !== 200) {
                    throw new AppError(
                        'Failed to fetch data from iNaturalist',
                        partialResponse.status
                    )
                }

                const partialProcessedData = processINaturalistData(
                    partialResponse.data
                )

                // Combine cached and fresh results
                const allTaxa = [...cachedTaxa]
                if (
                    'results' in partialProcessedData &&
                    Array.isArray(partialProcessedData.results)
                ) {
                    // Type assertion since we know this is a taxa response
                    allTaxa.push(
                        ...(partialProcessedData.results as INatTaxon[])
                    )
                }

                // Sort by original order
                const taxonOrder = new Map(
                    taxonIds.map((id, index) => [id, index])
                )
                allTaxa.sort(
                    (a, b) =>
                        (taxonOrder.get(a.id.toString()) ?? 0) -
                        (taxonOrder.get(b.id.toString()) ?? 0)
                )

                finalProcessedData = { results: allTaxa }

                // Cache the individual fresh taxa
                if (
                    'results' in partialProcessedData &&
                    Array.isArray(partialProcessedData.results)
                ) {
                    for (const taxon of partialProcessedData.results) {
                        const individualKey = `inat-proxy:${INATURALIST_API_BASE_URL}/taxa/${taxon.id}`
                        const individualData = { results: [taxon] }
                        await cacheService.set(individualKey, individualData)
                    }
                }
            } else {
                // No cache hits - proceed with normal flow
                const jsonResponse = await getWithRetry<ProcessableData>(url)
                if (jsonResponse.status !== 200) {
                    throw new AppError(
                        'Failed to fetch data from iNaturalist',
                        jsonResponse.status
                    )
                }
                finalProcessedData = processINaturalistData(jsonResponse.data)
            }
        } else {
            // Single taxon request - use normal flow
            const jsonResponse = await getWithRetry<ProcessableData>(url)
            if (jsonResponse.status !== 200) {
                throw new AppError(
                    'Failed to fetch data from iNaturalist',
                    jsonResponse.status
                )
            }
            finalProcessedData = processINaturalistData(jsonResponse.data)
        }
    } else {
        // Non-taxa request - use normal flow
        const jsonResponse = await getWithRetry<ProcessableData>(url)
        if (jsonResponse.status !== 200) {
            throw new AppError(
                'Failed to fetch data from iNaturalist',
                jsonResponse.status
            )
        }
        finalProcessedData = processINaturalistData(jsonResponse.data)
    }

    // Cache individual taxa from batch responses to improve cache hit rate
    if (
        path.startsWith('/taxa/') &&
        'results' in finalProcessedData &&
        Array.isArray(finalProcessedData.results)
    ) {
        const taxonIds = path.replace('/taxa/', '').split(',')
        if (taxonIds.length > 1) {
            // Only for batch requests
            const taxaResponse = finalProcessedData as { results: INatTaxon[] }
            for (const taxon of taxaResponse.results) {
                const individualKey = `inat-proxy:${INATURALIST_API_BASE_URL}/taxa/${taxon.id}`
                const individualData = { results: [taxon] }
                await cacheService.set(individualKey, individualData)
            }
            logger.info(
                `🔍 Cached ${taxaResponse.results.length} individual taxa from batch`
            )
        }
    }

    // Only cache the batch if we actually made a full API call
    if (shouldCacheBatch) {
        await cacheService.set(cacheKey, finalProcessedData)
    }

    logger.info(`🔍 Processed iNaturalist data for path: ${path}`)
    return res.status(200).json(finalProcessedData)
}

// Factory function
export const createINaturalistAPIController = () => iNaturalistAPIController
export default iNaturalistAPIController
