// rateLimiterGlobal.ts
import { RateLimiterRedis } from 'rate-limiter-flexible'
import redisClient from '../config/redisClient.js'

// Use higher limits in development/mock mode to avoid interfering with testing
const isDevelopment = process.env.NODE_ENV === 'development'
const useMock = process.env.USE_MOCK_INAT === 'true'

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
