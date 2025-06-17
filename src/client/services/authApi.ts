// src/services/authApi.ts

import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
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
import { z } from 'zod'
import { tokenManager } from './tokenManager'

export const authApi = {
    async register(credentials: z.infer<typeof RegisterRequestSchema>) {
        try {
            const { data, status } = await axios.post('/api/auth/register', credentials)
            if (status === 201) return data as RegisterResponseData
            handleError(Error(`Unexpected response status: ${status}`))
        } catch (err) {
            handleError(err)
        }
    },

    async login(credentials: z.infer<typeof LoginRequestSchema>) {
        try {
            const { data, status } = await axios.post('/api/auth/login', credentials)
            if (status !== 200 || !data) {
                handleError({ data: 'Could not login user' })
                return null
            }

            const { user, refreshToken, accessToken } = data
            tokenManager.setUser(user)
            tokenManager.setAccessToken(accessToken)
            tokenManager.setRefreshToken(refreshToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            return data as LoginResponseData
        } catch (err) {
            handleError(err)
            return null
        }
    },

    async logout(): Promise<void> {
        try {
            const user = tokenManager.getUser()
            if (user?.cuid) {
                await axios.post('/api/auth/logout', { user_cuid: user.cuid })
            }
        } catch (err) {
            handleError(err)
        } finally {
            tokenManager.clearAll()
            delete axios.defaults.headers.common['Authorization']
        }
    },

    async refreshAccessToken(): Promise<void> {
        const refreshToken = tokenManager.getRefreshToken()
        const user = tokenManager.getUser()
        const user_cuid = user?.cuid

        if (!refreshToken || !user_cuid) {
            handleError('Missing refresh token or user_cuid')
            return
        }

        try {
            const { data, status } = await axios.post('/api/auth/refresh', {
                user_cuid,
                refresh_token: refreshToken,
            })

            if (status !== 200 || !data.access_token) {
                tokenManager.clearAll()
                handleError(`Token refresh failed with status: ${status}`)
                return
            }

            tokenManager.setAccessToken(data.access_token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
        } catch (error) {
            console.error('Error during token refresh:', error)
            tokenManager.clearAll()
            handleError(error)
        }
    },

    verifyToken(token: string | null): boolean {
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
                    this.verifyToken(tokenManager.getAccessToken())
                })
                .catch((_err) => {
                    tokenManager.clearAll()
                    alert('Session expired. Please log in again.')
                })
            return false
        }
    },
}
