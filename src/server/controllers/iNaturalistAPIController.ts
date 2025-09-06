// src/controllers/iNaturalistAPIController.ts
import axios from 'axios'
import chalk from 'chalk'
import { Request, Response } from 'express'
import { cacheService } from '../services/cache/cacheService.js'
import {
    globalINaturalistRateLimiter,
    iNaturalistAggressiveLimiter,
} from '../utils/rateLimiterGlobal.js'
import { getWithRetry } from '../utils/retryWithBackoff.js'
import { getDeduplicatedRequest } from '../utils/iNatAPI.js'

// Simple circuit breaker state
let circuitBreakerOpen = false
let circuitBreakerResetTime = 0
const CIRCUIT_BREAKER_TIMEOUT = 15000 // 15 seconds - reduced from 60s
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 5 // Only activate after 5 consecutive failures
import logger from '../config/logger.js'
import { titleCase } from '../utils/titleCase.js'
import { INatObservation, INatTaxon } from '../../shared/types/index.js'
import { AppError } from '../middlewares/errorHandler.js'
import { MockINatService } from '../services/mockINatService.js'
import { serverDebug } from '../../shared/utils/debug.js'

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

        return processed as unknown as INatTaxon | INatObservation
    }

    return data
}

export const iNaturalistAPIController = async (req: Request, res: Response) => {
    serverDebug.api('iNaturalistAPIController called')
    const path = req.path

    // Special endpoint to clear cache
    if (path === '/clear-cache' && req.method === 'POST') {
        await cacheService.flush()
        return res.status(200).json({ message: 'Cache cleared successfully' })
    }

    // Diagnostic endpoint for rate limiting status
    if (path === '/rate-limit-status' && req.method === 'GET') {
        const globalStatus = await globalINaturalistRateLimiter.get('global')
        const aggressiveStatus = await iNaturalistAggressiveLimiter.get('mode')
        const aggressiveRequestsStatus =
            await iNaturalistAggressiveLimiter.get('requests')

        return res.status(200).json({
            globalLimiter: {
                remainingPoints: globalStatus?.remainingPoints ?? 120,
                isBlocked: (globalStatus?.remainingPoints ?? 120) <= 0,
                msBeforeNext: globalStatus?.msBeforeNext ?? 0,
                totalPoints: 120, // Updated to match our temporary increase
            },
            aggressiveMode: {
                isActive: (aggressiveStatus?.remainingPoints ?? 1) <= 0,
                remainingPoints: aggressiveRequestsStatus?.remainingPoints ?? 5,
                msBeforeNext: aggressiveRequestsStatus?.msBeforeNext ?? 0,
            },
            circuitBreaker: {
                isOpen: circuitBreakerOpen,
                consecutiveFailures,
                resetTime: circuitBreakerResetTime,
            },
            clientInfo: {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            },
            timestamp: new Date().toISOString(),
        })
    }

    // Use mock data in development to avoid rate limits
    if (
        process.env.NODE_ENV === 'development' &&
        process.env.USE_MOCK_INAT === 'true'
    ) {
        logger.info('🔧 Using mock iNaturalist data for development')
        logger.info(`DEBUG: Path: ${path}, Query:`, JSON.stringify(req.query))

        if (path.startsWith('/taxa/autocomplete')) {
            const query = (req.query.q as string) || ''
            const mockResponse = MockINatService.searchTaxa(query, req.query)
            return res.status(200).json(mockResponse)
        }

        if (path === '/taxa') {
            // Handle /taxa?q=... for search
            if (req.query.q) {
                const query = (req.query.q as string) || ''
                const mockResponse = MockINatService.searchTaxa(
                    query,
                    req.query
                )
                return res.status(200).json(mockResponse)
            }
            // Handle /taxa?id=1,2,3 format used by AI tools
            if (req.query.id) {
                const ids = Array.isArray(req.query.id)
                    ? (req.query.id as string[])
                    : [req.query.id as string]
                const mockResponse = MockINatService.getTaxaByIds(ids)
                return res.status(200).json(mockResponse)
            }
        }

        if (path.startsWith('/taxa/')) {
            const taxonIds = path
                .replace('/taxa/', '')
                .split(',')
                .filter((id) => id.trim())
            if (taxonIds.length > 0) {
                const mockResponse = MockINatService.getTaxa(taxonIds)
                return res.status(200).json(mockResponse)
            }
        }

        if (path.startsWith('/observations')) {
            const mockResponse = MockINatService.getObservations(req.query)
            return res.status(200).json(mockResponse)
        }

        if (path.startsWith('/places')) {
            if (
                process.env.NODE_ENV === 'development' &&
                process.env.USE_MOCK_INAT === 'true'
            ) {
                const mockResponse = MockINatService.getPlaces()
                return res.status(200).json(mockResponse)
            }
            // For production, let it fall through to the normal API proxy
        }

        if (path.startsWith('/observations/species_counts')) {
            const mockResponse = MockINatService.getSpeciesCounts(req.query)
            return res.status(200).json(mockResponse)
        }

        if (path.startsWith('/photos')) {
            // Return mock photo data
            return res.status(200).json({
                results: [
                    {
                        id: 1,
                        license_code: 'CC-BY',
                        attribution: 'Mock Photo',
                        url: 'https://via.placeholder.com/500x500?text=Mock+Photo',
                        original_dimensions: { height: 500, width: 500 },
                        flags: [],
                        square_url:
                            'https://via.placeholder.com/100x100?text=Mock+Photo',
                        medium_url:
                            'https://via.placeholder.com/300x300?text=Mock+Photo',
                    },
                ],
                total_results: 1,
                page: 1,
                per_page: 1,
            })
        }

        // Return empty response for unhandled endpoints
        logger.warn(
            `🔧 Mock iNaturalist: Unhandled endpoint: ${path} with query:`,
            req.query
        )
        return res.status(200).json({ results: [] })
    }

    // Check circuit breaker with gradual recovery
    if (circuitBreakerOpen) {
        const now = Date.now()
        if (now < circuitBreakerResetTime) {
            // Calculate recovery progress correctly
            const timeElapsed =
                CIRCUIT_BREAKER_TIMEOUT - (circuitBreakerResetTime - now)
            const recoveryProgress = Math.max(
                0,
                Math.min(1, timeElapsed / CIRCUIT_BREAKER_TIMEOUT)
            )
            const allowThrough = Math.random() < recoveryProgress * 0.2 // 20% max during recovery

            if (!allowThrough) {
                const remainingMs = circuitBreakerResetTime - now
                const remainingSeconds = Math.ceil(remainingMs / 1000)

                logger.warn(
                    `Circuit breaker open. Retry after: ${remainingSeconds}s (recovery: ${(recoveryProgress * 100).toFixed(1)}%)`
                )

                return res
                    .status(429)
                    .set({
                        'Retry-After': remainingSeconds.toString(),
                        'X-RateLimit-Reset': new Date(
                            circuitBreakerResetTime
                        ).toISOString(),
                        'X-RateLimit-Source': 'circuit-breaker',
                    })
                    .json({
                        error: 'Too Many Requests',
                        message:
                            'Circuit breaker is open due to excessive rate limiting. Please try again later.',
                        retryAfter: remainingSeconds,
                        source: 'circuit-breaker',
                    })
            } else {
                logger.info(
                    `Circuit breaker: allowing request through during recovery period (${(recoveryProgress * 100).toFixed(1)}%)`
                )
            }
        } else {
            // Reset circuit breaker
            circuitBreakerOpen = false
            consecutiveFailures = 0
            logger.info('🔄 Circuit breaker reset - normal operation resumed')
        }
    }

    const query = new URLSearchParams(
        req.query as Record<string, string>
    ).toString()
    const url = `${INATURALIST_API_BASE_URL}${path}${query ? `?${query}` : ''}`
    const cacheKey = `inat-proxy:${url}`

    // Check cache first
    const cachedData = await cacheService.get<ProcessableData>(cacheKey)
    if (cachedData) {
        logger.info(chalk.blue(`Serving from cache: ${url} (IP: ${req.ip})`))
        return res.status(200).json(cachedData)
    }

    // Log request frequency to detect duplicates
    logger.info(`New request - URL: ${url} (IP: ${req.ip})`)

    const isTile = path.match(/\.(png|jpg|jpeg|webp)$/)

    logger.info(`Proxying to: ${url} (IP: ${req.ip})`)

    try {
        // TEMPORARILY DISABLE ALL RATE LIMITING FOR DEBUGGING
        logger.info('🚫 All rate limiting temporarily disabled for debugging')

        // Skip rate limiting entirely for testing
        // await globalINaturalistRateLimiter.consume('global')

        // Reset consecutive failures on successful consumption
        consecutiveFailures = 0
    } catch (_error) {
        // Our internal rate limiter was hit - this should NOT activate circuit breaker
        // Circuit breaker should only activate on iNaturalist 429s
        const status = await globalINaturalistRateLimiter.get('global')
        logger.warn(`Rate limiter status: ${JSON.stringify(status)}`)

        // Fix: Use a reasonable retry-after time instead of the potentially huge msBeforeNext
        const retryAfterSeconds = 60 // 1 minute retry-after for our internal limits

        logger.warn(
            `🚨 OUR SERVER rate limit exceeded. Retry after: ${retryAfterSeconds}s (circuit breaker NOT activated)`
        )

        return res
            .status(429)
            .set({
                'Retry-After': retryAfterSeconds.toString(),
                'X-RateLimit-Reset': new Date(
                    Date.now() + retryAfterSeconds * 1000
                ).toISOString(),
                'X-RateLimit-Limit': '120', // Updated to match our temporary increase
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Source': 'server-internal',
            })
            .json({
                error: 'Too Many Requests',
                message: 'Server rate limit exceeded. Please try again later.',
                retryAfter: retryAfterSeconds,
                source: 'server-internal',
            })
    }

    const status = await globalINaturalistRateLimiter.get('global')
    const used = 100 - (status?.remainingPoints ?? 0)
    const remaining = status?.remainingPoints ?? 0
    const ms = status?.msBeforeNext ?? 0
    const minutes = ms / 1000 / 60

    logger.info(
        chalk.green(`iNaturalist API: Used ${used}/60`) +
            ', ' +
            chalk.yellow(`Remaining: ${remaining}`) +
            ', ' +
            chalk.blue(`Resets in: ${minutes.toFixed(2)} minutes`)
    )

    // Warn when approaching rate limit
    if (remaining <= 10) {
        logger.warn(
            `⚠️  iNaturalist API rate limit warning: ${remaining} requests remaining`
        )
    }

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

                const partialResponse = await getWithRetry<ProcessableData>(
                    partialUrl,
                    undefined,
                    {
                        retryOn429: true,
                        maxRetries: 3, // Reduce retries for deduplication efficiency
                    }
                )
                if (partialResponse.status !== 200) {
                    // If we got a 429 from iNaturalist, increment failure count
                    if (partialResponse.status === 429) {
                        consecutiveFailures++

                        // Activate aggressive rate limiting mode
                        await iNaturalistAggressiveLimiter.consume('mode')
                        logger.warn(
                            '🚨 iNaturalist 429 received - switching to aggressive rate limiting (5 req/min)'
                        )

                        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                            circuitBreakerOpen = true
                            circuitBreakerResetTime =
                                Date.now() + CIRCUIT_BREAKER_TIMEOUT
                            logger.warn(
                                `Received 429 from iNaturalist API - circuit breaker activated after ${consecutiveFailures} failures`
                            )
                        } else {
                            logger.warn(
                                `Received 429 from iNaturalist API (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} failures)`
                            )
                        }
                    }
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
                    // If we got a 429 from iNaturalist, increment failure count
                    if (jsonResponse.status === 429) {
                        consecutiveFailures++

                        // Activate aggressive rate limiting mode
                        await iNaturalistAggressiveLimiter.consume('mode')
                        logger.warn(
                            '🚨 iNaturalist 429 received - switching to aggressive rate limiting (5 req/min)'
                        )

                        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                            circuitBreakerOpen = true
                            circuitBreakerResetTime =
                                Date.now() + CIRCUIT_BREAKER_TIMEOUT
                            logger.warn(
                                `Received 429 from iNaturalist API - circuit breaker activated after ${consecutiveFailures} failures`
                            )
                        } else {
                            logger.warn(
                                `Received 429 from iNaturalist API (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} failures)`
                            )
                        }
                    }
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
            // If we got a 429 from iNaturalist, increment failure count
            if (jsonResponse.status === 429) {
                consecutiveFailures++

                // Activate aggressive rate limiting mode
                await iNaturalistAggressiveLimiter.consume('mode')
                logger.warn(
                    '🚨 iNaturalist 429 received - switching to aggressive rate limiting (5 req/min)'
                )

                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    circuitBreakerOpen = true
                    circuitBreakerResetTime =
                        Date.now() + CIRCUIT_BREAKER_TIMEOUT
                    logger.warn(
                        `Received 429 from iNaturalist API - circuit breaker activated after ${consecutiveFailures} failures`
                    )
                } else {
                    logger.warn(
                        `Received 429 from iNaturalist API (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} failures)`
                    )
                }
            }
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
