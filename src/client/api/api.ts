import axios from 'axios'
import { authApi } from '@/services/authApi'

const api = axios.create({
    baseURL: '/api',
})

// Token getter function that can be configured
let getAccessToken: (() => string | null) | null = null

export const configureApiTokens = (tokenGetter: () => string | null) => {
    getAccessToken = tokenGetter
}

// Request interceptor
api.interceptors.request.use((config) => {
    const token = getAccessToken ? getAccessToken() : null

    // Add token if it exists and the URL is not a public quest-sharing URL
    if (token && !config.url?.includes('/quest-sharing/')) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Log more details about the error
        console.log('Response error:', {
            status: error.response?.status,
            isRetry: originalRequest._retry,
            url: originalRequest.url,
            error: error.message,
        })

        // Check if it's a 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                console.log('Attempting token refresh...')
                await authApi.refreshAccessToken()

                // Update the Authorization header with the new token
                const newToken = getAccessToken ? getAccessToken() : null
                originalRequest.headers.Authorization = newToken
                    ? `Bearer ${newToken}`
                    : ''

                console.log(
                    'Token refresh successful, retrying with new token:',
                    {
                        newToken: newToken
                            ? newToken.substring(0, 10) + '...'
                            : 'none',
                    }
                )

                // Retry the original request with the new token
                return api(originalRequest)
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                // Redirect to login only if refresh actually failed
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // If it's not a 401 or we've already tried to refresh, reject with the original error
        return Promise.reject(error)
    }
)

export default api
