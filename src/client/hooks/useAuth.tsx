// useAuth.tsx

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
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
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => !!(user && accessToken && authApi.verifyToken(accessToken))
    )

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
    }, [
        user,
        accessToken,
        refreshToken,
        saveAccessToken,
        saveRefreshToken,
        saveUser,
        clearAll,
    ])

    useEffect(() => {
        const isValid = user && accessToken && authApi.verifyToken(accessToken)
        setIsAuthenticated(!!isValid)
        if (!isValid) {
            clearAll()
        }
    }, [accessToken, user])

    const login = async (credentials: LoginRequestBody) => {
        try {
            const response = await authApi.login(credentials)
            if (!response?.user) {
                setIsAuthenticated(false)
                return
            }
            setIsAuthenticated(true)
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
                login,
                logout,
                register,
                user,
                accessToken,
                verifyToken: authApi.verifyToken,
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
