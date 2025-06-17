import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import { authApi } from '@/services/authApi.js'
import { tokenManager } from '@/services/tokenManager.js'
import { handleError } from '@/helpers/errorHandler.js'
import { toast } from '@/hooks/use-toast.js'
import {
    LoginRequestBody,
    RegisterRequestBody,
} from '../../types/types.js'
import type {
    LoggedInUser,
    LoginResponseData,
    RegisterResponseData,
} from '../../shared/types/authTypes.js'

type AuthContextType = {
    isAuthenticated: boolean
    login: (credentials: LoginRequestBody) => Promise<LoginResponseData | undefined>
    logout: () => void
    register: (
        registrationData: RegisterRequestBody
    ) => Promise<RegisterResponseData | undefined>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [_user, setUser] = useState<LoggedInUser | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

    useEffect(() => {
        const storedUser = tokenManager.getUser()
        const token = tokenManager.getAccessToken()

        if (storedUser && token && authApi.verifyToken(token)) {
            setUser(storedUser)
            setIsAuthenticated(true)
        } else {
            setUser(null)
            setIsAuthenticated(false)
        }
    }, [])

    const login = async (credentials: LoginRequestBody) => {
        try {
            const response = await authApi.login(credentials)
            console.log({ response })
            if (!response) {
                setIsAuthenticated(false)
                handleError('Login failed')
                return
            }

            setUser(response.user)
            setIsAuthenticated(true)
            return response
        } catch (error) {
            setIsAuthenticated(false)
            handleError(`Login error in AuthProvider: ${error}`)
            throw error
        }
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setUser(null)
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
        <AuthContext.Provider value={{ isAuthenticated, login, logout, register }}>
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
