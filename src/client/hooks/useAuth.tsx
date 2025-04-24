import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import authService from '@/services/authService.js'
import {handleError} from '@/helpers/errorHandler.js'
import {
    LoginRequest,
    LoginResponseData,
    RegisterResponseData,
} from '@shared/types/authTypes.js'
import {toast} from '@/hooks/use-toast.js'
import {LoginRequestBody, RegisterRequestBody} from '../../types/types.js'

type AuthContextType = {
    // State management
    userId: string | null
    isAuthenticated: boolean
    // Methods
    login: (
        credentials: LoginRequestBody
    ) => Promise<LoginResponseData | undefined>
    logout: (userId?: string) => void
    register: (
        registrationData: RegisterRequestBody
    ) => Promise<RegisterResponseData | undefined>
}
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

type User = {
    id: string
    email: string
    username: string
    cuid: string
}

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

    useEffect(() => {
        const storedUserJSON = localStorage.getItem('user')
        const storedUserId = localStorage.getItem('user_cuid')
        const storedAccessToken = localStorage.getItem('access_token')

        if (
            storedUserId &&
            storedAccessToken &&
            storedUserJSON &&
            authService.verifyToken(storedAccessToken)
        ) {
            setUser(JSON.parse(storedUserJSON))
            setUserId(storedUserId)
            setIsAuthenticated(true)
        } else {
            setUser(null)
            setUserId(null)
            setIsAuthenticated(false)
        }
    }, [])

    const login = async (credentials: LoginRequestBody) => {
        try {
            // console.log(credentials)
            const response = await authService.login(credentials)

            if (!response) {
                setIsAuthenticated(false)
                setUserId(null)
                console.log('LoginRequestBody error')
                handleError({data: 'Could not login user'})
                return
            } else if (response.user_cuid.length) {
                console.log('Authenticated')
                setIsAuthenticated(true)
                setUserId(response.user_cuid)
                return response
            } else {
                console.log('Why here?')
            }
        } catch (error) {
            setIsAuthenticated(false)
            setUserId(null)
            handleError(`Login error in AuthProvider: ${error}`)
            throw error // Re-throw so the component using login knows it failed
        }
    }

    const logout = async () => {
        try {
            const userId = localStorage.getItem('user_cuid')
            if (userId) {
                await authService.logout(userId)
            }
            localStorage.removeItem('user_cuid')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setIsAuthenticated(false)
            setUserId(null)
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const register = async (registrationData: RegisterRequestBody) => {
        try {
            toast({title: 'Hello there'})
            return await authService.register(registrationData)
            // TODO: Log in user if successfully registered
        } catch (error) {
            console.error('Registration error:', error)
            throw error // Let the component handle the error
        }
    }

    return (
        <AuthContext.Provider
            value={{isAuthenticated, userId, login, logout, register}}
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

export {useAuth}
