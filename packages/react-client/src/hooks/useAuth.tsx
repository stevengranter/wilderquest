import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react'
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import z from "zod";
import { useNavigate } from 'react-router'
import { loginAPI } from '@/authService.ts'
import { toast } from '@/hooks/use-toast.ts'

type UserContextType = {
  user: string | null,
  token: string | null,
  registerUser: (email: string, username:string, password: string) => void,
  loginUser: (username: string, password: string) => void,
  requestAccessToken: () => Promise<string | null>,
  logout: () => void,
  isLoggedIn: () => boolean,
}

type DecodedToken = {
  email: string,
  exp: number,
}

const DecodedTokenSchema = z.object({
  email: z.string().email(),
  exp: z.number(), // Changed from string to number
});


type Props = {
  children: React.ReactNode;
}

const UserContext = createContext<UserContextType>({} as UserContextType)

export const UserProvider = ({children}:Props) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false)

  const requestAccessToken = useCallback( async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');

    try {
      const response = await axios.post('/api/refresh', { user, refreshToken });
      console.log(response)
      const newAccessToken = response.data.accessToken;
      localStorage.setItem('access_token', newAccessToken);
      setToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout(); // Log out if refresh fails
      navigate("/login")
    }
  },[navigate]);

  useEffect(() => {
    const user = localStorage.getItem("user")
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const parsedToken = DecodedTokenSchema.safeParse(decodedToken)
      if (parsedToken.error) {
        console.log(parsedToken.error.message)
      }
      const currentTime = Date.now() / 1000;
      if ((parsedToken.data as DecodedToken).exp > currentTime) {
        setToken(token);
      } else {
        console.log("Token expired")
        // Token is expired, attempt to refresh it
        requestAccessToken().then((res)=>{
          console.log(res)
        });
      }
    }
    if (user && token) {
      console.log('User and token found in local storage')
      setUser(user)
      setToken(token)
      axios.defaults.headers.common["Authorization"] = "Bearer " + token
      console.log(axios.defaults.headers.common["Authorization"])
    }
    setIsReady(true)
  }, [requestAccessToken]);

  const loginUser = async (username: string, password:string) => {
    const res = await loginAPI(username, password)
    console.log(res)

    if (res?.statusText === "OK") {
      toast({
        title: res?.statusText,
        description: "Successfully signed in"
      });
      console.log(res.data)
      const { username, accessToken, refreshToken, } = res.data;


      localStorage.setItem('user', username);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setToken(accessToken);
    }
  }

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token')
    setToken(null);
    setUser(null);
    navigate("/");
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const registerUser = () => {console.log("To be implemented")}


  return (
      <UserContext.Provider value={{user,token, isLoggedIn,loginUser,registerUser,logout, requestAccessToken}}>
        {isReady ? children : null}
      </UserContext.Provider>
  )
}




const useAuth = () => useContext(UserContext);

export default useAuth
