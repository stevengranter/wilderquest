import { useState, useCallback } from 'react'

export interface GeolocationState {
    latitude: number | null
    longitude: number | null
    loading: boolean
    error: string | null
}

export interface GeolocationHook extends GeolocationState {
    getCurrentLocation: () => Promise<void>
    clearError: () => void
}

export function useGeolocation(): GeolocationHook {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
    })

    const getCurrentLocation = useCallback(async (): Promise<void> => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: 'Geolocation is not supported by this browser',
                loading: false,
            }))
            return
        }

        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000, // 5 minutes
                    })
                }
            )

            setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                loading: false,
                error: null,
            })
        } catch (error) {
            let errorMessage = 'Failed to get your location'

            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage =
                            'Location access denied. Please enable location permissions.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.'
                        break
                }
            }

            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }))
        }
    }, [])

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }))
    }, [])

    return {
        ...state,
        getCurrentLocation,
        clearError,
    }
}
