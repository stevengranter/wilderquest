// rateLimiterGlobal.ts
import { RateLimiterRedis } from 'rate-limiter-flexible'
import redisClient from '../config/redisClient.js'

export const globalINaturalistRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'iNaturalistGlobal',
    points: 10_000, // Allow 10_000 requests
    duration: 24 * 60 * 60, // Reset every day
})

export const globalThunderForestRateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'mapTilesGlobal',
    points: 150_000, // Allow 150,000 requests
    duration: 30 * 24 * 60 * 60, // Reset every 30 days (seconds)
})
