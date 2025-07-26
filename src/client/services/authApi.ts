// src/services/authApi.ts

import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { z } from 'zod'
import api from '@/api/api'
import { handleError } from '@/helpers/errorHandler.js'
import { DecodedToken, DecodedTokenSchema } from '@/models/token.js'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
} from '../../shared/schemas/Auth.js'
import type {
    LoggedInUser,
    LoginResponseData,
    RegisterResponseData,
} from '../../shared/types/authTypes.js'

export type TokenCallbacks = {
    accessToken: string | null
    refreshToken: string | null
    user: LoggedInUser | null // Change this line to use LoggedInUser
    saveAccessToken: (token: string) => void
    saveRefreshToken: (token: string) => void
    saveUser: (user: LoggedInUser | null) => void // Change this line to accept LoggedInUser
    clearAll: () => void
}

let callbacks: TokenCallbacks | null = null

export function configureAuthApi(cb: TokenCallbacks) {
    callbacks = cb
}

export const authApi = {
    async register(credentials: z.infer<typeof RegisterRequestSchema>) {
        try {
            const { data, status } = await api.post(
                '/auth/register',
                credentials
            )
            if (status === 201) return data as RegisterResponseData
            handleError(Error(`Unexpected response status: ${status}`))
        } catch (err) {
            handleError(err)
        }
    },

    async login(credentials: z.infer<typeof LoginRequestSchema>) {
        try {
            const { data, status } = await api.post('/auth/login', credentials)
            if (status !== 200 || !data) {
                handleError({ data: 'Could not login user' })
                return null
            }

            if (callbacks) {
                callbacks.clearAll()
                callbacks.saveUser(data.user)
                callbacks.saveAccessToken(data.accessToken)
                callbacks.saveRefreshToken(data.refreshToken)
            } else {
                console.error('No callbacks configured for authAPI')
            }

            axios.defaults.headers.common['Authorization'] =
                `Bearer ${data.accessToken}`
            return data as LoginResponseData
        } catch (err: unknown) {
            // Explicitly type err as unknown
            // Now, safely check if it's an AxiosError or a generic Error
            handleError(err)
            return
        }
    },

    async logout(): Promise<void> {
        if (!callbacks) {
            console.error('No callbacks configured for authAPI')
            return
        }
        try {
            const user = callbacks.user
            if (user?.cuid) {
                await api.post('/auth/logout', { user_cuid: user.cuid })
            }
        } catch (err: unknown) {
            handleError(err)
            return
        } finally {
            callbacks.clearAll()
            delete axios.defaults.headers.common['Authorization']
        }
    },

    async refreshAccessToken(): Promise<{
        access_token: string
        refresh_token: string
    } | null> {
        if (!callbacks) {
            console.error('No callbacks configured for authAPI')
            throw new Error('No callbacks configured for authAPI')
        }

        const refreshToken = callbacks.refreshToken
        const user = callbacks.user
        const user_cuid = user?.cuid

        console.log('Refresh Token Details:', {
            hasRefreshToken: !!refreshToken,
            hasUser: !!user,
            userCuid: user_cuid,
        })

        if (!refreshToken || !user_cuid) {
            callbacks.clearAll()
            throw new Error('Missing refresh token or user_cuid')
        }

        try {
            console.log('Calling refresh token endpoint...')
            const response = await api.post('/auth/refresh', {
                user_cuid,
                refresh_token: refreshToken,
            })

            console.log('Refresh response:', {
                status: response.status,
                data: response.data,
                hasAccessToken: !!response.data?.access_token,
                hasRefreshToken: !!response.data?.refresh_token,
            })

            if (!response.data?.access_token || !response.data?.refresh_token) {
                callbacks.clearAll()
                console.log('Invalid token refresh response')
            }

            callbacks.saveAccessToken(response.data.access_token)
            callbacks.saveRefreshToken(response.data.refresh_token)

            console.log('Tokens successfully updated')

            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
            }
        } catch (error) {
            console.error('Refresh token error:', error)
            callbacks.clearAll()
            throw error
        }
    },

    verifyToken(token: string | null): boolean {
        if (!token) return false

        try {
            const decoded: DecodedToken = jwtDecode(token)
            const parsed = DecodedTokenSchema.safeParse(decoded)

            if (!parsed.success) {
                return false
            }

            const now = Date.now() / 1000
            return parsed.data.exp > now
        } catch {
            return false
        }
    },
}

// Add this to authApi.ts
export const testUtils = {
    async simulateExpiredToken() {
        if (!callbacks?.accessToken) {
            console.error('No access token to expire')
            return false
        }

        const oldToken = callbacks.accessToken
        console.log(
            'Starting token refresh test with token:',
            oldToken.substring(0, 10) + '...'
        )

        try {
            // Make sure we use the test endpoint that always returns 401
            const response = await api.get('/auth/test-auth')
            console.log('Unexpected success from test endpoint:', response)
            return false
        } catch (_error) {
            // Give the refresh process time to complete
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Get the new token
            const newToken = callbacks.accessToken
            const wasRefreshed = oldToken !== newToken

            console.log('Token refresh test complete:', {
                wasRefreshed,
                oldToken: oldToken.substring(0, 10) + '...',
                newToken: newToken.substring(0, 10) + '...',
                tokenChanged: oldToken !== newToken,
            })

            // Verify the new token exists and is different
            return newToken !== '' && newToken !== null && wasRefreshed
        }
    },
}
