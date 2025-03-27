import { useState, useEffect } from 'react';
import axios from "axios";
import {jwtDecode} from 'jwt-decode';
import z from "zod";

type DecodedToken = {
  email: string,
  exp: number,
}

const DecodedTokenSchema = z.object({
  email: z.string().email(),
  exp: z.number(), // Changed from string to number
});

const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);



  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);
      const parsedToken = DecodedTokenSchema.safeParse(decodedToken)
      if (parsedToken.error) {
        console.log(parsedToken.error.message)
      }
      const currentTime = Date.now() / 1000;
      if ((parsedToken.data as DecodedToken).exp > currentTime) {
        setToken(storedToken);
      } else {
        console.log("Token expired")
        // Token is expired, attempt to refresh it
        refreshToken().then(()=>{console.log("New access token set")});
      }
    }
  }, [token]);

  const login = (user: string, accessToken:string, refreshToken:string) => {
    localStorage.setItem('user', user);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token')
    setToken(null);
  };

  const refreshToken = async () => {
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
      throw error;
    }
  };

  const sendRequestWithToken = async (url:string, method = 'GET', data = null) => {
    if (!token) {
      throw new Error('No token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle Axios-specific errors
        console.error("Axios Error:", error.message);
        if (error.response) {
          console.error("Response Data:", error.response.data)
          console.error("Response Status:", error.response.status)
        }
      } else {
        // Handle other types of errors
        console.error("Generic Error:", error);
      }
    }
  };

  return { token, login, logout, sendRequestWithToken };
};

export default useAuth;
