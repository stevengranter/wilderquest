// rateLimiterGlobal.ts
import 'dotenv/config'
import Redis from 'ioredis'
import { RateLimiterRedis } from 'rate-limiter-flexible'

const redisClient = new Redis.default({
    host: process.env.REDIS_URL || 'localhost',
    port: 6379,
    enableOfflineQueue: false,
})

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
