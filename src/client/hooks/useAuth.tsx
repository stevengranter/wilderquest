import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import { toast } from '@/hooks/use-toast.js'
import { authApi, configureAuthApi } from '@/services/authApi.js'
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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

    useEffect(() => {
        configureAuthApi({
            user,
            saveUser,
            saveAccessToken,
            accessToken,
            saveRefreshToken,
            refreshToken,
            clearAll,
        })
    }, [])

    useEffect(() => {
        console.log(accessToken)
    }, [accessToken])

    useEffect(() => {
        console.log(accessToken)
    }, [accessToken])

    useEffect(() => {
        if (user && accessToken && authApi.verifyToken(accessToken)) {
            saveUser(user)
            saveAccessToken(accessToken)
            setIsAuthenticated(true)
        } else {
            saveUser(null)
            saveAccessToken('')
            setIsAuthenticated(false)
        }
    }, [accessToken])

    const login = async (credentials: LoginRequestBody) => {
        try {
            const response = await authApi.login(credentials)
            console.log(response)
            if (!response || !response.user) {
                setIsAuthenticated(false)
                // handleError('Could not log in')
                return
            }

            saveUser(response.user)
            setIsAuthenticated(true)
            return response
        } catch (error) {
            setIsAuthenticated(false)
            // handleError(`Login error in AuthProvider: ${error}`)
            throw error
        }
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            saveUser(null)
            setIsAuthenticated(false)
        }
    }

    const register = async (registrationData: RegisterRequestBody) => {
        try {
            toast({ title: 'Welcome!' })
            return await authApi.register(registrationData)
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
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export { useAuth }
