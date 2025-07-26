import axios from 'axios'
import { authApi } from '@/services/authApi'

const api = axios.create({
    baseURL: '/api',
})

// Helper function to clean token from potential quotes
const cleanToken = (token: string | null): string | null => {
    if (!token) return null
    // Remove surrounding quotes if they exist
    return token.replace(/^"(.*)"$/, '$1')
}

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    const cleanedToken = cleanToken(token)
    if (cleanedToken) {
        config.headers.Authorization = `Bearer ${cleanedToken}`
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
                const newToken = localStorage.getItem('accessToken')
                const cleanedNewToken = cleanToken(newToken)
                originalRequest.headers.Authorization = `Bearer ${cleanedNewToken}`

                console.log(
                    'Token refresh successful, retrying with new token:',
                    {
                        newToken: cleanedNewToken
                            ? cleanedNewToken.substring(0, 10) + '...'
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
