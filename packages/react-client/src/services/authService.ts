import axios from "axios";
import { API_URL } from "@/constants.ts";
import { UserProfileToken } from "@/models/user";
import { handleError } from '@/helpers/errorHandler.tsx'

export const loginAPI = async (email:string, password:string) => {
 try {
   return await axios.post<UserProfileToken>(API_URL + "auth/login", {
     email: email,
     password: password
   })
 } catch(error) {
  handleError(error)
 }
}

export const registerAPI = async (username:string, email:string, password:string) => {
    try {
        return await axios.post<UserProfileToken>(API_URL + "auth/register", {
            username: username,
            email: email,
            password: password
        })
    } catch(error) {
        console.log(error)
    }
}




