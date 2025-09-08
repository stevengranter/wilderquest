import { Redis } from 'ioredis'
import env from './app.config.js'

const redisClient: Redis = new Redis(env.REDIS_URL || 'redis://localhost:6379')

export default redisClient