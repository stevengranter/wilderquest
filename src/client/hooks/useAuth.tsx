import { jwtDecode } from 'jwt-decode'
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { authApi, configureAuthApi, TokenCallbacks } from '@/services/authApi.js'
import { configureApiTokens } from '@/api/api.js'
import useTokenManager from '@/services/tokenManager.js'
import type { LoggedInUser, LoginResponseData, RegisterResponseData } from '@shared/types/authTypes'
import { LoginRequestBody, RegisterRequestBody } from '../../types/types.js'

type AuthContextType = {
    isAuthenticated: boolean
    authLoading: boolean
    login: (
        credentials: LoginRequestBody
    ) => Promise<LoginResponseData | undefined>
    logout: () => void
    register: (
        registrationData: RegisterRequestBody
    ) => Promise<RegisterResponseData | undefined>
    user: LoggedInUser | null
    accessToken: string | null
    verifyToken: (token: string | null) => boolean
    getValidToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const {
        user,
        saveUser,
        accessToken,
        saveAccessToken,
        refreshToken,
        saveRefreshToken,
        clearAll,
    } = useTokenManager()

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)

    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const accessTokenRef = useRef<string | null>(accessToken)
    const getValidTokenRef = useRef<() => Promise<string | null>>(
        async () => null
    )

    useEffect(() => {
        accessTokenRef.current = accessToken
    }, [accessToken])

    useEffect(() => {
        const tokenCallbacks: TokenCallbacks = {
            user,
            accessToken,
            refreshToken,
            saveAccessToken,
            saveRefreshToken,
            saveUser,
            clearAll,
        }
        configureAuthApi(tokenCallbacks)
        configureApiTokens(() => accessToken || null)
    }, [
        user,
        accessToken,
        refreshToken,
        saveAccessToken,
        saveRefreshToken,
        saveUser,
        clearAll,
    ])

    const isTokenExpiringSoon = useCallback((token: string | null): boolean => {
        if (!token) return true
        try {
            const decoded = jwtDecode<{ exp: number }>(token)
            const now = Date.now() / 1000
            const timeUntilExpiry = decoded.exp - now
            return timeUntilExpiry < 60
        } catch {
            return true
        }
    }, [])

    const getValidToken = useCallback(async (): Promise<string | null> => {
        const currentToken = accessTokenRef.current
        if (!currentToken) {
            console.log('🔒 No access token available')
            return null
        }

        if (
            authApi.verifyToken(currentToken) &&
            !isTokenExpiringSoon(currentToken)
        ) {
            console.log('✅ Current token is valid and not expiring soon')
            return currentToken
        }

        console.log('🔄 Refreshing token...')

        try {
            const response = await authApi.refreshAccessToken()
            const newToken = response?.access_token

            if (newToken) {
                console.log('✅ Token refresh successful')
                saveAccessToken(newToken)
                accessTokenRef.current = newToken
                scheduleTokenRefresh(newToken)
                return newToken
            } else {
                console.error('❌ Token refresh failed - no token returned')
            }
        } catch (error) {
            console.error('❌ Token refresh error:', error)
            clearAll()
            setIsAuthenticated(false)
        }

        return null
    }, [isTokenExpiringSoon, saveAccessToken, clearAll])

    // Assign the latest version of getValidToken to the ref
    getValidTokenRef.current = getValidToken

    const scheduleTokenRefresh = useCallback((token: string | null) => {
        if (!token) return
        try {
            const decoded = jwtDecode<{ exp: number }>(token)
            const now = Date.now() / 1000
            const timeUntilExpiry = decoded.exp - now
            const refreshIn = (timeUntilExpiry - 30) * 1000

            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }

            refreshTimeoutRef.current = setTimeout(
                async () => {
                    try {
                        await getValidTokenRef.current()
                    } catch (err) {
                        console.error('Scheduled token refresh failed:', err)
                    }
                },
                Math.max(refreshIn, 0)
            )
        } catch {
            console.warn('Unable to schedule token refresh')
        }
    }, [])

    useEffect(() => {
        const restoreAuthState = async () => {
            const token = accessTokenRef.current
            const valid = token && authApi.verifyToken(token)

            if (user && token && valid && !isTokenExpiringSoon(token)) {
                setIsAuthenticated(true)
                scheduleTokenRefresh(token)
            } else if (refreshToken) {
                const refreshedToken = await getValidTokenRef.current()
                if (refreshedToken) {
                    setIsAuthenticated(true)
                } else {
                    clearAll()
                    setIsAuthenticated(false)
                }
            } else {
                clearAll()
                setIsAuthenticated(false)
            }

            setAuthLoading(false)
        }

        restoreAuthState()
    }, [])

    const login = async (credentials: LoginRequestBody) => {
        try {
            const response = await authApi.login(credentials)
            if (!response?.user) {
                setIsAuthenticated(false)
                return
            }
            setIsAuthenticated(true)
            accessTokenRef.current = response.access_token
            scheduleTokenRefresh(response.access_token)
            return response
        } catch (error) {
            setIsAuthenticated(false)
            throw error
        }
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } finally {
            clearAll()
            setIsAuthenticated(false)
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }
        }
    }

    const register = async (registrationData: RegisterRequestBody) => {
        try {
            const response = await authApi.register(registrationData)
            toast('Welcome!')
            return response
        } catch (error) {
            console.error('Registration error:', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                authLoading,
                login,
                logout,
                register,
                user,
                accessToken,
                verifyToken: authApi.verifyToken,
                getValidToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
