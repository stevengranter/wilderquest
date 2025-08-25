import { ICacheService } from './ICacheService.types.js'
import { memoryCacheService } from './memoryCacheService.js'
import { redisCacheService } from './redisCacheService.js'

export const tieredCacheService: ICacheService = {
    get: async <T>(key: string): Promise<T | undefined> => {
        let value = await memoryCacheService.get<T>(key)
        if (value) {
            return value
        }

        value = await redisCacheService.get<T>(key)
        if (value) {
            await memoryCacheService.set(key, value)
        }
        return value
    },

    set: async <T>(key: string, value: T): Promise<boolean> => {
        const memoryResult = await memoryCacheService.set(key, value)
        const redisResult = await redisCacheService.set(key, value)
        return memoryResult && redisResult
    },

    del: async (key: string): Promise<boolean> => {
        const memoryResult = await memoryCacheService.del(key)
        const redisResult = await redisCacheService.del(key)
        return !!(memoryResult && redisResult)
    },

    flush: async (): Promise<void> => {
        await memoryCacheService.flush()
        await redisCacheService.flush()
    },
}
