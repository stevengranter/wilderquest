import {createContext, ReactNode, useContext, useEffect, useState} from 'react'
import authService from "@/services/authService.js";
import {handleError} from "@/helpers/errorHandler.js";
import {UserRegistrationData} from "@/models/user.js";
import {
    LoginRequest,
    LoginResponseData,
    RegisterResponseData
} from "@shared/types/authTypes.js";
import {toast} from '@/hooks/use-toast.js'


type AuthContextType = {
    // State management
    userId: string | null,
    isAuthenticated: boolean,
    // Methods
    login: (credentials: LoginRequest) => Promise<LoginResponseData | undefined>,
    logout: (userId?: string) => void,
    register: (registrationData: UserRegistrationData) => Promise<RegisterResponseData | undefined>
}
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

    useEffect(() => {
        const storedUserId = localStorage.getItem("user_cuid");
        const storedAccessToken = localStorage.getItem("access_token");

        if (storedUserId && storedAccessToken && authService.verifyToken(storedAccessToken)) {
            setUserId(storedUserId);
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            setUserId(null)
        }
    }, []);


    const login = async (credentials: { username: string, password: string }) => {
        try {
            // console.log(credentials)
            const response = await authService.login(credentials);
            console.log("response from authService: ")
            console.log(response)

           if (!response) {
               setIsAuthenticated(false);
               setUserId(null);
               console.log("Login error")
               handleError({data: "Could not login user"})
               return
           } else if (response.user_cuid.length) {
               console.log("Authenticated")
               setIsAuthenticated(true);
               setUserId(response.user_cuid);
               return response
           } else {
               console.log("Why here?")
           }


        } catch (error) {
            setIsAuthenticated(false);
            setUserId(null);
            handleError(`Login error in AuthProvider: ${error}`);
            throw error; // Re-throw so the component using login knows it failed
        }
    };

    const logout = async () => {
        try {
            const userId = localStorage.getItem("user_cuid")
            if (userId) {
                await authService.logout(userId);
            }
            localStorage.removeItem("user_cuid");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setIsAuthenticated(false);
            setUserId(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const register = async (registrationData: UserRegistrationData) => {
        try {
            toast({title:"Hello there"})
            return await authService.register(registrationData)
            // TODO: Log in user if successfully registered
        } catch (error) {
            console.error("Registration error:", error);
            throw error; // Let the component handle the error
        }
    };


    return (
        <AuthContext.Provider
            value={{isAuthenticated, userId, login, logout, register}}>
            {children}
        </AuthContext.Provider>
    )
}

const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export {useAuth}

