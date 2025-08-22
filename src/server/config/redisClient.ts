// src/server/config/redisClient.ts
import Redis from 'ioredis'
import env from './app.config.js'

const redisClient = new Redis.default(env.REDIS_URL || 'redis://localhost:6379')

export default redisClient
