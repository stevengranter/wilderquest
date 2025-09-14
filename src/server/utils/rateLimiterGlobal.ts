// rateLimiterGlobal.ts
import { RateLimiterRedis } from 'rate-limiter-flexible'
import redisClient from '../config/redisClient.js'
import logger from '../config/logger.js'

// Use higher limits in development/mock mode to avoid interfering with testing
const isDevelopment = process.env.NODE_ENV === 'development'
const useMock = process.env.USE_MOCK_INAT === 'true'

// Utility functions for global rate limiter logging
const logGlobalRateLimitConsumption = async (
    limiter: RateLimiterRedis,
    limiterName: string,
    points: number
) => {
    try {
        const status = await limiter.get('global')
        const used = points - (status?.remainingPoints ?? 0)
        const remaining = status?.remainingPoints ?? 0
        logger.debug(`${limiterName}: Used=${used}, Remaining=${remaining}`)
    } catch (error) {
        logger.error(`Failed to get ${limiterName} status:`, error)
    }
}

const logGlobalRateLimitExceeded = (
    limiterName: string,
    error: Error & { remainingPoints?: number; msBeforeNext?: number }
) => {
    logger.warn(`${limiterName} global rate limit exceeded`, {
        remainingPoints: error.remainingPoints,
        msBeforeNext: error.msBeforeNext,
        retryAfter: Math.ceil((error.msBeforeNext || 0) / 1000),
    })
}

// Wrapper functions for rate limiters with logging
export const consumeWithLogging = async (
    limiter: RateLimiterRedis,
    limiterName: string,
    points: number,
    key: string = 'global'
) => {
    try {
        await limiter.consume(key)
        await logGlobalRateLimitConsumption(limiter, limiterName, points)
    } catch (error: unknown) {
        logGlobalRateLimitExceeded(
            limiterName,
            error as Error & { remainingPoints?: number; msBeforeNext?: number }
        )
        throw error
    }
}

export const getWithLogging = async (
    limiter: RateLimiterRedis,
    limiterName: string,
    points: number,
    key: string = 'global'
) => {
    try {
        const status = await limiter.get(key)
        const used = points - (status?.remainingPoints ?? 0)
        const remaining = status?.remainingPoints ?? 0
        logger.debug(
            `${limiterName} status: Used=${used}, Remaining=${remaining}`
        )
        return status
    } catch (error) {
        logger.error(`Failed to get ${limiterName} status:`, error)
        return null
    }
}

export const globalINaturalistRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'iNaturalistGlobal',
    points: isDevelopment && useMock ? 1000 : 120, // Temporarily increased to 120/min for debugging
    duration: 60, // Reset every minute
})

export const globalThunderForestRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'mapTilesGlobal',
    points: 150_000, // Allow 150,000 requests
    duration: 30 * 24 * 60 * 60, // Reset every 30 days (seconds)
})

export const iNaturalistAggressiveLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'iNaturalistAggressive',
    points: 5, // 5 requests per minute when aggressive (activated when iNaturalist sends 429)
    duration: 60, // Auto-reset after 5 minutes
})
