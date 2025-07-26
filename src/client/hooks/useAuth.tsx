import { jwtDecode } from 'jwt-decode'
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { toast } from '@/hooks/use-toast.js'
import {
    authApi,
    configureAuthApi,
    TokenCallbacks,
} from '@/services/authApi.js'
import useTokenManager from '@/services/tokenManager.js'
import type {
    LoggedInUser,
    LoginResponseData,
    RegisterResponseData,
} from '../../shared/types/authTypes.js'
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
    const isAuthenticatedRef = useRef<boolean>(isAuthenticated)

    useEffect(() => {
        accessTokenRef.current = accessToken
        isAuthenticatedRef.current = isAuthenticated
    }, [accessToken, isAuthenticated])

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
    }, [user, accessToken, refreshToken])

    useEffect(() => {
        const isValid = user && accessToken && authApi.verifyToken(accessToken)
        setIsAuthenticated(!!isValid)
        if (!isValid) {
            clearAll()
        } else {
            scheduleTokenRefresh(accessToken)
        }
        setAuthLoading(false)
    }, [accessToken, user])

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

        console.log(
            '🔄 Token refresh needed - current token is expired or expiring soon'
        )

        try {
            console.log('📡 Attempting to refresh access token...')
            const response = await authApi.refreshAccessToken()
            const newToken = response?.access_token

            if (newToken) {
                console.log('✅ Token refresh successful')
                console.log(
                    '🔑 New token expires in:',
                    (() => {
                        try {
                            const decoded = jwtDecode<{ exp: number }>(newToken)
                            const timeUntilExpiry =
                                decoded.exp - Date.now() / 1000
                            return `${Math.floor(timeUntilExpiry / 60)}m ${Math.floor(timeUntilExpiry % 60)}s`
                        } catch {
                            return 'unknown'
                        }
                    })()
                )
                saveAccessToken(newToken)
                accessTokenRef.current = newToken
                scheduleTokenRefresh(newToken)
                return newToken
            } else {
                console.error('❌ Token refresh failed - no new token received')
            }
        } catch (error) {
            console.error('❌ Token refresh failed with error:', error)
            setIsAuthenticated(false)
            clearAll()
        }

        return null
    }, [isTokenExpiringSoon, clearAll, saveAccessToken])

    const scheduleTokenRefresh = useCallback(
        (token: string | null) => {
            if (!token) return
            try {
                const decoded = jwtDecode<{ exp: number }>(token)
                const now = Date.now() / 1000
                const timeUntilExpiry = decoded.exp - now
                const refreshIn = (timeUntilExpiry - 30) * 1000 // 30s before expiry

                if (refreshTimeoutRef.current) {
                    clearTimeout(refreshTimeoutRef.current)
                }

                refreshTimeoutRef.current = setTimeout(
                    async () => {
                        try {
                            await getValidToken()
                        } catch (err) {
                            console.error('Scheduled refresh failed:', err)
                        }
                    },
                    Math.max(refreshIn, 0)
                )
            } catch {
                console.warn('Unable to schedule token refresh')
            }
        },
        [getValidToken]
    )

    const login = async (credentials: LoginRequestBody) => {
        try {
            const response = await authApi.login(credentials)
            if (!response?.user) {
                setIsAuthenticated(false)
                return
            }
            setIsAuthenticated(true)
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
            toast({ title: 'Welcome!' })
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
