import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'
import { toast } from 'sonner'
import type {
    LoggedInUser,
    LoginResponseData,
    RegisterResponseData,
} from '@shared/types/authTypes'
import { LoginRequestBody, RegisterRequestBody } from '@/types'
import { clientDebug } from '../../lib/debug'

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

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
} as const

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authLoading, setAuthLoading] = useState(true)
    const [user, setUser] = useState<LoggedInUser | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [refreshToken, setRefreshToken] = useState<string | null>(null)

    // Helper functions for localStorage
    const saveToStorage = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value)
        } catch (error) {
            console.warn('Failed to save to localStorage:', error)
        }
    }

    const getFromStorage = (key: string): string | null => {
        try {
            return localStorage.getItem(key)
        } catch (error) {
            console.warn('Failed to read from localStorage:', error)
            return null
        }
    }

    const removeFromStorage = (key: string) => {
        try {
            localStorage.removeItem(key)
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error)
        }
    }

    const clearAllStorage = () => {
        Object.values(STORAGE_KEYS).forEach(removeFromStorage)
    }

    // Token verification
    const verifyToken = useCallback((token: string | null): boolean => {
        if (!token) return false
        try {
            const decoded = jwtDecode<{ exp: number }>(token)
            const now = Date.now() / 1000
            return decoded.exp > now
        } catch {
            return false
        }
    }, [])

    const isTokenExpiringSoon = useCallback(
        (token: string | null, bufferSeconds: number = 300): boolean => {
            if (!token) return true
            try {
                const decoded = jwtDecode<{ exp: number }>(token)
                const now = Date.now() / 1000
                const timeUntilExpiry = decoded.exp - now
                return timeUntilExpiry < bufferSeconds // Expires within buffer time
            } catch {
                return true
            }
        },
        []
    )

    const refreshAccessToken = async (): Promise<string | null> => {
        // Get the current refresh token from state or storage
        const currentRefreshToken =
            refreshToken || getFromStorage(STORAGE_KEYS.REFRESH_TOKEN)
        // Get the current user from state or storage to get the cuid
        const currentUser =
            user ||
            (() => {
                const storedUser = getFromStorage(STORAGE_KEYS.USER)
                return storedUser ? JSON.parse(storedUser) : null
            })()

        if (!currentRefreshToken || !currentUser?.cuid) {
            clientDebug.auth(
                '❌ Missing refresh token or user cuid for token refresh'
            )
            clientDebug.auth('Has refresh token:', !!currentRefreshToken)
            clientDebug.auth('Has user cuid:', !!currentUser?.cuid)
            return null
        }

        try {
            clientDebug.auth(
                '🔄 Attempting to refresh access token with cuid:',
                currentUser.cuid
            )

            const response = await axios.post('/api/auth/refresh', {
                user_cuid: currentUser.cuid,
                refresh_token: currentRefreshToken,
            })

            clientDebug.auth('📥 Refresh response:', response.data)

            // Handle your server's response format
            const newAccessToken =
                response.data.access_token ||
                response.data.accessToken ||
                response.data.token
            const newRefreshToken =
                response.data.refresh_token || response.data.refreshToken

            if (!newAccessToken) {
                clientDebug.auth('❌ No access token in refresh response')
                return null
            }

            clientDebug.auth('✅ Token refresh successful')

            // Update the refresh token if a new one was provided
            if (newRefreshToken) {
                setRefreshToken(newRefreshToken)
                saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
            }

            return newAccessToken
        } catch (error) {
            clientDebug.auth('❌ Token refresh failed:', error)
            return null
        }
    }

    const getValidToken = useCallback(async (): Promise<string | null> => {
        // Get the current access token from state or storage
        const currentToken =
            accessToken || getFromStorage(STORAGE_KEYS.ACCESS_TOKEN)

        if (!currentToken) {
            clientDebug.auth('🔒 No access token available')
            return null
        }

        if (verifyToken(currentToken) && !isTokenExpiringSoon(currentToken)) {
            clientDebug.auth('✅ Current token is valid and not expiring soon')
            return currentToken
        }

        clientDebug.auth(
            '🔄 Token expired or expiring soon, attempting refresh...'
        )

        try {
            const newToken = await refreshAccessToken()

            if (newToken && verifyToken(newToken)) {
                clientDebug.auth('✅ Token refresh successful, updating state')
                setAccessToken(newToken)
                saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, newToken)
                return newToken
            } else {
                clientDebug.auth(
                    '❌ Token refresh failed or returned invalid token'
                )
                // Clear all auth data and force re-login
                setUser(null)
                setAccessToken(null)
                setRefreshToken(null)
                setIsAuthenticated(false)
                clearAllStorage()
                return null
            }
        } catch (error) {
            console.error('❌ Token refresh error:', error)
            // Clear all auth data and force re-login
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
            setIsAuthenticated(false)
            clearAllStorage()
            return null
        }
    }, [accessToken, refreshToken, verifyToken, isTokenExpiringSoon])

    const login = async (
        credentials: LoginRequestBody
    ): Promise<LoginResponseData | undefined> => {
        clientDebug.auth('🔐 LOGIN FUNCTION CALLED')
        clientDebug.auth('🔐 Credentials received:', {
            ...credentials,
            password: '[HIDDEN]',
        })

        try {
            clientDebug.auth('🔐 Making login request to /api/auth/login')

            const response = await axios.post('/api/auth/login', credentials)
            const responseData = response.data

            clientDebug.auth('📦 Raw login response received successfully!')
            clientDebug.auth('📦 Response type:', typeof response.data)
            clientDebug.auth(
                '📦 Response keys:',
                response.data ? Object.keys(response.data) : 'No response'
            )
            clientDebug.auth(
                '📦 Full response object:',
                JSON.stringify(response.data, null, 2)
            )

            if (!response.data) {
                clientDebug.auth('❌ Response data is null/undefined')
                throw new Error('No response received from server')
            }

            // Log each expected property
            clientDebug.auth('🔍 Checking response properties:')
            clientDebug.auth('🔍 response.user:', response.data.user)
            clientDebug.auth(
                '🔍 response.access_token:',
                response.data.access_token
            )
            clientDebug.auth(
                '🔍 response.refresh_token:',
                response.data.refresh_token
            )

            if (!response.data.user) {
                clientDebug.auth('❌ Response missing user property')
                clientDebug.auth(
                    '❌ Available properties:',
                    Object.keys(response.data)
                )
                throw new Error('Invalid login response - missing user data')
            }

            // Check if the login was successful (your server includes a success property)
            if (response.data.success !== true) {
                clientDebug.auth('❌ Server returned success: false')
                throw new Error('Login failed - server returned success: false')
            }

            // Check for access token with different possible property names
            const loginAccessToken =
                responseData.access_token ||
                responseData.accessToken ||
                responseData.token
            if (!loginAccessToken) {
                clientDebug.auth('❌ Response missing access token')
                clientDebug.auth(
                    '❌ Available properties:',
                    Object.keys(responseData)
                )
                clientDebug.auth('❌ Tried: access_token, accessToken, token')
                throw new Error('Invalid login response - missing access token')
            }

            clientDebug.auth('✅ Valid login response, updating state...')
            clientDebug.auth('✅ User data:', response.data.user)
            clientDebug.auth(
                '✅ Access token found:',
                loginAccessToken ? 'YES' : 'NO'
            )
            clientDebug.auth(
                '✅ Access token length:',
                loginAccessToken?.length
            )

            // Update state - use the found access token
            setUser(response.data.user)
            setAccessToken(loginAccessToken)
            setRefreshToken(
                response.data.refresh_token ||
                    response.data.refreshToken ||
                    null
            )
            setIsAuthenticated(true)

            // Save to localStorage
            saveToStorage(STORAGE_KEYS.USER, JSON.stringify(responseData.user))
            saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, loginAccessToken)
            const storedRefreshToken =
                responseData.refresh_token || responseData.refreshToken
            if (storedRefreshToken) {
                saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, storedRefreshToken)
            }

            clientDebug.auth('✅ Valid login response, updating state...')
            clientDebug.auth('✅ User data:', responseData.user)
            clientDebug.auth(
                '✅ Access token found:',
                loginAccessToken ? 'YES' : 'NO'
            )
            clientDebug.auth(
                '✅ Access token length:',
                loginAccessToken?.length
            )

            // Update state - use the found access token
            setUser(responseData.user)
            setAccessToken(loginAccessToken)
            setRefreshToken(
                responseData.refresh_token || responseData.refreshToken || null
            )
            setIsAuthenticated(true)

            // Save to localStorage
            saveToStorage(STORAGE_KEYS.USER, JSON.stringify(responseData.user))
            saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, loginAccessToken)
            const loginRefreshToken =
                responseData.refresh_token || responseData.refreshToken
            if (loginRefreshToken) {
                saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, loginRefreshToken)
            }

            // Log each expected property
            clientDebug.auth('🔍 Checking response properties:')
            clientDebug.auth('🔍 response.user:', responseData.user)
            clientDebug.auth(
                '🔍 response.access_token:',
                responseData.access_token
            )
            clientDebug.auth(
                '🔍 response.refresh_token:',
                responseData.refresh_token
            )

            if (!responseData.user) {
                clientDebug.auth('❌ Response missing user property')
                clientDebug.auth(
                    '❌ Available properties:',
                    Object.keys(responseData)
                )
                throw new Error('Invalid login response - missing user data')
            }

            // Check if the login was successful (your server includes a success property)
            if (responseData.success !== true) {
                clientDebug.auth('❌ Server returned success: false')
                throw new Error('Login failed - server returned success: false')
            }

            clientDebug.auth('💾 Auth state saved successfully')
            clientDebug.auth('💾 Returning response to caller')
            return responseData
        } catch (error) {
            clientDebug.auth('❌❌❌ ERROR IN LOGIN FUNCTION ❌❌❌')
            clientDebug.auth('❌ Error type:', typeof error)
            clientDebug.auth('❌ Error constructor:', error?.constructor?.name)
            clientDebug.auth('❌ Error object:', error)

            if (error instanceof Error) {
                clientDebug.auth('❌ Error name:', error.name)
                clientDebug.auth('❌ Error message:', error.message)
                clientDebug.auth('❌ Error stack:', error.stack)
            }

            setIsAuthenticated(false)
            clientDebug.auth('❌ Rethrowing error to caller')
            throw error
        }
    }

    const logout = async () => {
        try {
            // Call logout endpoint if token exists
            if (accessToken) {
                await axios.post(
                    '/api/auth/logout',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )
            }
        } catch (error) {
            console.error('Logout API call failed:', error)
        } finally {
            // Always clear state and storage
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
            setIsAuthenticated(false)
            clearAllStorage()
        }
    }

    const register = async (
        registrationData: RegisterRequestBody
    ): Promise<RegisterResponseData | undefined> => {
        try {
            const response = await axios.post(
                '/api/auth/register',
                registrationData
            )

            toast('Welcome!')
            return response.data
        } catch (error) {
            console.error('Registration error:', error)
            throw error
        }
    }

    // Initialize auth state on mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                clientDebug.auth('🚀 Initializing auth state...')

                const storedUser = getFromStorage(STORAGE_KEYS.USER)
                const storedAccessToken = getFromStorage(
                    STORAGE_KEYS.ACCESS_TOKEN
                )
                const storedRefreshToken = getFromStorage(
                    STORAGE_KEYS.REFRESH_TOKEN
                )

                clientDebug.auth('📦 Stored data found:', {
                    hasUser: !!storedUser,
                    hasAccessToken: !!storedAccessToken,
                    hasRefreshToken: !!storedRefreshToken,
                })

                if (!storedUser || !storedAccessToken) {
                    clientDebug.auth(
                        '❌ Missing stored user or access token, skipping auth restoration'
                    )
                    setAuthLoading(false)
                    return
                }

                const parsedUser = JSON.parse(storedUser) as LoggedInUser

                // Set the tokens in state first so refreshAccessToken can use them
                setRefreshToken(storedRefreshToken)

                // Check if token is valid
                if (
                    verifyToken(storedAccessToken) &&
                    !isTokenExpiringSoon(storedAccessToken)
                ) {
                    clientDebug.auth(
                        '✅ Stored token is valid, restoring auth state'
                    )
                    setUser(parsedUser)
                    setAccessToken(storedAccessToken)
                    setIsAuthenticated(true)
                } else if (storedRefreshToken) {
                    clientDebug.auth(
                        '🔄 Stored token expired, attempting refresh...'
                    )

                    // Try to refresh the token
                    const newToken = await refreshAccessToken()

                    if (newToken && verifyToken(newToken)) {
                        clientDebug.auth(
                            '✅ Token refresh successful, restoring auth state'
                        )
                        setUser(parsedUser)
                        setAccessToken(newToken)
                        setIsAuthenticated(true)
                        saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, newToken)
                    } else {
                        clientDebug.auth(
                            '❌ Token refresh failed, clearing auth state'
                        )
                        clearAllStorage()
                        setIsAuthenticated(false)
                    }
                } else {
                    clientDebug.auth(
                        '❌ No valid token and no refresh token, clearing auth state'
                    )
                    clearAllStorage()
                    setIsAuthenticated(false)
                }
            } catch (error) {
                console.error('❌ Auth initialization error:', error)
                clearAllStorage()
                setIsAuthenticated(false)
            } finally {
                setAuthLoading(false)
            }
        }

        initializeAuth()
    }, []) // Remove dependencies to avoid infinite loops

    // Proactive token refresh mechanism
    useEffect(() => {
        if (!isAuthenticated || authLoading) return

        const checkAndRefreshToken = async () => {
            const currentToken =
                accessToken || getFromStorage(STORAGE_KEYS.ACCESS_TOKEN)
            if (!currentToken) return

            // Check if token expires within 5 minutes
            if (isTokenExpiringSoon(currentToken, 300)) {
                clientDebug.auth(
                    '🔄 Token expiring soon, proactively refreshing...'
                )
                try {
                    const newToken = await refreshAccessToken()
                    if (newToken && verifyToken(newToken)) {
                        clientDebug.auth(
                            '✅ Proactive token refresh successful'
                        )
                        setAccessToken(newToken)
                        saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, newToken)
                    } else {
                        clientDebug.auth('❌ Proactive token refresh failed')
                        // Clear auth state to force re-login
                        setUser(null)
                        setAccessToken(null)
                        setRefreshToken(null)
                        setIsAuthenticated(false)
                        clearAllStorage()
                    }
                } catch (error) {
                    console.error(
                        '❌ Error during proactive token refresh:',
                        error
                    )
                    // Clear auth state to force re-login
                    setUser(null)
                    setAccessToken(null)
                    setRefreshToken(null)
                    setIsAuthenticated(false)
                    clearAllStorage()
                }
            }
        }

        // Check every minute for token expiration
        const intervalId = setInterval(checkAndRefreshToken, 60 * 1000)

        // Also check immediately when component mounts
        checkAndRefreshToken()

        return () => clearInterval(intervalId)
    }, [
        isAuthenticated,
        authLoading,
        accessToken,
        refreshAccessToken,
        verifyToken,
        isTokenExpiringSoon,
    ])

    const contextValue: AuthContextType = {
        isAuthenticated,
        authLoading,
        login,
        logout,
        register,
        user,
        accessToken,
        verifyToken,
        getValidToken,
    }

    return (
        <AuthContext.Provider value={contextValue}>
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
