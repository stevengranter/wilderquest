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
    LoginResponseData,
    RegisterResponseData,
} from '../../shared/types/authTypes.js'

type TokenCallbacks = {
    accessToken: string | null
    refreshToken: string | null
    user: { cuid: string; username: string } | null
    saveAccessToken: (token: string) => void
    saveRefreshToken: (token: string) => void
    saveUser: (user: { cuid: string; username: string }) => void
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

    async refreshAccessToken(): Promise<void> {
        if (!callbacks) {
            console.error('No callbacks configured for authAPI')
            return
        }
        const refreshToken = callbacks.refreshToken
        const user = callbacks.user
        const user_cuid = user?.cuid

        if (!refreshToken || !user_cuid) {
            handleError('Missing refresh token or user_cuid')
            return
        }

        try {
            const { data, status } = await api.post('/auth/refresh', {
                user_cuid,
                refresh_token: refreshToken,
            })

            if (status !== 200 || !data.access_token) {
                callbacks.clearAll()
                handleError(`Token refresh failed with status: ${status}`)
                return
            }
            callbacks.saveAccessToken(data.access_token)
            callbacks.saveRefreshToken(data.refresh_token)
            axios.defaults.headers.common['Authorization'] =
                `Bearer ${data.access_token}`
        } catch (error) {
            console.error('Error during token refresh:', error)
            callbacks.clearAll()
            handleError(error)
        }
    },

    verifyToken(token: string | null): boolean | undefined {
        if (!token) return false

        const decoded: DecodedToken = jwtDecode(token)
        const parsed = DecodedTokenSchema.safeParse(decoded)

        if (!parsed.success) {
            console.error('Token decode error:', parsed.error)
            return false
        }

        const now = Date.now() / 1000
        if (parsed.data.exp > now) {
            return true
        } else {
            this.refreshAccessToken()
                .then(() => {
                    if (!callbacks) {
                        console.error('No callbacks configured for authAPI')
                        return
                    }
                    this.verifyToken(callbacks.accessToken)
                })
                .catch((_err) => {
                    if (!callbacks) {
                        console.error('No callbacks configured for authAPI')
                        return
                    }
                    callbacks.clearAll()
                    alert('Session expired. Please log in again.')
                })
            return false
        }
    },
}
