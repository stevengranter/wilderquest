import NodeCache from 'node-cache'
import { ICacheService } from '../types/ICacheService.js'

const memoryCache = new NodeCache({ stdTTL: 3600 }) // 1 hour TTL

export const memoryCacheService: ICacheService = {
    get: async <T>(key: string): Promise<T | undefined> => {
        return memoryCache.get<T>(key)
    },

    set: async <T>(key: string, value: T): Promise<boolean> => {
        return memoryCache.set(key, value)
    },

    del: async (key: string): Promise<number> => {
        return memoryCache.del(key)
    },

    flush: async (): Promise<void> => {
        memoryCache.flushAll()
    },
}
