import {
    useState,
    useEffect,
    useCallback,
} from 'react'
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import z from "zod";
import { useNavigate } from 'react-router'
import { loginAPI } from '@/services/authService.ts'
import { toast } from '@/hooks/use-toast.ts'
import { API_URL } from '@/constants.ts'
import UserContext from './UserContext';




const DecodedTokenSchema = z.object({
    user: z.string().email(),
    iat: z.number(),
    exp: z.number(), // Changed from string to number
});


type Props = {
    children: React.ReactNode;
}



const UserProvider = ({children}:Props) => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false)


    const logout = useCallback (() => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token')
        setToken(null);
        setUser(null);
        navigate("/");
    },[navigate]);

    const refreshAccessToken = useCallback( async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        const user = localStorage.getItem('user');

        try {
            if (user && refreshToken) {
                const response = await axios.post(API_URL + "/refresh", { user, refreshToken });
                const newAccessToken = response.data.accessToken;
                localStorage.setItem('access_token', newAccessToken);
                setToken(newAccessToken);
                axios.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken
                return newAccessToken;
            } else {
                console.error("User or refresh token not found")
                logout()
                navigate("/login")
                return null
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
            logout(); // Log out if refresh fails
            navigate("/login")
        }
    },[navigate,logout]);

    useEffect(() => {
        const user = localStorage.getItem("user")
        const token = localStorage.getItem('access_token');
        if (token) {
            const decodedToken = jwtDecode(token);
            console.log(JSON.stringify(decodedToken))
            const parsedToken = DecodedTokenSchema.safeParse(decodedToken)


            if (parsedToken.error) {
                console.log(parsedToken.error.message)
            }
            const currentTime = Date.now() / 1000;

            if (parsedToken.data && parsedToken.data.exp > currentTime) {
                console.log("Token is valid")
                setToken(token);
            }
            else {
                console.log("Token expired")
                // Token is expired, attempt to refresh it
                refreshAccessToken().then(()=>{
                    console.log("New access token granted")
                });
            }
        }
        if (user && token) {
            setUser(user)
            setToken(token)
            axios.defaults.headers.common["Authorization"] = "Bearer " + token
        }
        setIsReady(true)
    }, [refreshAccessToken]);

    const loginUser = async (username: string, password:string) => {
        const res = await loginAPI(username, password)

        if (res?.statusText === "OK") {
            toast({
                title: res?.statusText,
                description: "Successfully signed in"
            });
            const { user, accessToken, refreshToken, } = res.data;
            localStorage.setItem('user', user);
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            setToken(accessToken);
        }
    }



    const isLoggedIn = () => {
        return !!user;
    };

    const registerUser = () => {console.log("To be implemented")}


    return (
        <UserContext.Provider value={{user,token, isLoggedIn,loginUser,registerUser,logout, refreshAccessToken}}>
            {isReady ? children : null}
        </UserContext.Provider>
    )
}

export default UserProvider
