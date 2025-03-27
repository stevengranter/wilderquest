import { createContext } from 'react'

type UserContextType = {
    user: string | null,
    token: string | null,
    registerUser: (email: string, username:string, password: string) => void,
    loginUser: (username: string, password: string) => void,
    refreshAccessToken: () => Promise<string | null>,
    logout: () => void,
    isLoggedIn: () => boolean,
}
const UserContext = createContext<UserContextType>({} as UserContextType)

export default UserContext
