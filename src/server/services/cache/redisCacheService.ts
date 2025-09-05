import redisClient from '../../config/redisClient.js'
import { ICacheService } from './ICacheService.types.js'

const CACHE_TTL = 7 * 86400 // 7 days

export const redisCacheService: ICacheService = {
    get: async <T>(key: string): Promise<T | undefined> => {
        const value = await redisClient.get(key)
        if (value) {
            return JSON.parse(value) as T
        }
        return undefined
    },

    set: async <T>(key: string, value: T): Promise<boolean> => {
        const result = await redisClient.set(
            key,
            JSON.stringify(value),
            'EX',
            CACHE_TTL
        )
        return result === 'OK'
    },

    del: async (key: string): Promise<number> => {
        return await redisClient.del(key)
    },

    flush: async (): Promise<string> => {
        return await redisClient.flushall()
    },
}
