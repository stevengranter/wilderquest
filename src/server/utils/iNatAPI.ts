import axios from 'axios'

export const BATCH_SIZE = 30

export const iNatAPI = axios.create({
    baseURL: 'https://api.inaturalist.org/v1',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request deduplication cache
const pendingRequests = new Map<string, Promise<unknown>>()

export function getDeduplicatedRequest<T = unknown>(
    url: string,
    config?: Record<string, unknown>
): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(config || {})}`

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)! as Promise<T>
    }

    const request = iNatAPI
        .get<T>(url, config)
        .then((response) => response.data)
        .finally(() => {
            // Clean up after request completes (success or failure)
            pendingRequests.delete(cacheKey)
        })

    pendingRequests.set(cacheKey, request)
    return request
}
