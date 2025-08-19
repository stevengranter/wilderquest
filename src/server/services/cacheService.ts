import NodeCache from 'node-cache'

// Create a new cache instance with a TTL of 24 hours for each entry
const cache = new NodeCache({ stdTTL: 86400 })

export const cacheService = {
    get: <T>(key: string): T | undefined => {
        return cache.get<T>(key)
    },

    set: <T>(key: string, value: T): boolean => {
        return cache.set(key, value)
    },

    del: (key: string): number => {
        return cache.del(key)
    },

    flush: (): void => {
        cache.flushAll()
    },
}
