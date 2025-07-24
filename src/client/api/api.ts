// api.ts
import axios from 'axios'
import { authApi } from '@/services/authApi'

const api = axios.create({
    baseURL: '/api',
})

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        console.log('Response error:', {
            status: error.response?.status,
            isRetry: originalRequest._retry,
            url: originalRequest.url,
        })

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            console.log('Attempting token refresh...')

            try {
                await authApi.refreshAccessToken()
                console.log(
                    'Token refresh successful, retrying original request'
                )
                return api(originalRequest)
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }
        return Promise.reject(error)
    }
)

export default api
