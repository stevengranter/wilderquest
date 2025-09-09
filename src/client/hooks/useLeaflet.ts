import { useEffect, useState } from 'react'
import {
    loadLeaflet,
    isLeafletLoaded,
    LeafletLoadOptions,
} from '@/lib/leafletLoader'

/**
 * React hook for dynamically loading Leaflet
 * @param options - Optional configuration for Leaflet loading
 * @returns Object with loading state, error state, and Leaflet instance
 */
export function useLeaflet(options: LeafletLoadOptions = {}) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [isLoaded, setIsLoaded] = useState(isLeafletLoaded())

    useEffect(() => {
        // If already loaded, no need to do anything
        if (isLoaded) {
            return
        }

        setIsLoading(true)
        setError(null)

        loadLeaflet(options)
            .then(() => {
                setIsLoaded(true)
                setIsLoading(false)
            })
            .catch((err) => {
                setError(err)
                setIsLoading(false)
            })
    }, [isLoaded, options])

    return {
        isLoading,
        error,
        isLoaded,
        L: isLoaded && typeof window !== 'undefined' ? window.L : null,
    }
}
