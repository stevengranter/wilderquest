import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

// Token getter function that can be configured with useAuth context
let getValidToken: (() => Promise<string | null>) | null = null

export const configureApiTokens = (
    tokenGetter: () => Promise<string | null>
) => {
    getValidToken = tokenGetter
}

// Request interceptor
api.interceptors.request.use(async (config) => {
    // Get a valid token (will refresh if needed)
    if (getValidToken) {
        try {
            const token = await getValidToken()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        } catch (error) {
            console.warn('Failed to get valid token for request:', error)
            // Continue without token - the request might be public
        }
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

                // Get a fresh token (this will handle refresh automatically)
                if (getValidToken) {
                    const newToken = await getValidToken()

                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`

                        console.log(
                            'Token refresh successful, retrying with new token:',
                            {
                                newToken: newToken.substring(0, 10) + '...',
                            }
                        )

                        // Retry the original request with the new token
                        return api(originalRequest)
                    }
                }

                // If we get here, token refresh failed
                throw new Error('Token refresh failed')
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                // Show user-friendly error message
                console.log(
                    '🔄 Token refresh failed - redirecting to login for re-authentication'
                )
                // Add a small delay to show the error state briefly
                setTimeout(() => {
                    window.location.href = '/login?reason=session_expired'
                }, 1000)
                return Promise.reject(refreshError)
            }
        }

        // If it's not a 401 or we've already tried to refresh, reject with the original error
        return Promise.reject(error)
    }
)

export default api
