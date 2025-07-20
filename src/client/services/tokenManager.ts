import { useLocalStorage } from '@uidotdev/usehooks'
import { LoggedInUser } from '../../shared/types/authTypes'

export default function useTokenManager() {
    const [accessToken, saveAccessToken] = useLocalStorage<string>(
        'accessToken',
        ''
    )
    const [refreshToken, saveRefreshToken] = useLocalStorage<string>(
        'refreshToken',
        ''
    )
    const [user, saveUser] = useLocalStorage<LoggedInUser | null>('user', null)

    const clearAll = () => {
        saveAccessToken('')
        saveRefreshToken('')
        saveUser(null)
    }

    return {
        accessToken,
        saveAccessToken,
        refreshToken,
        saveRefreshToken,
        user,
        saveUser,
        clearAll,
    }
}

// export const tokenManager = {
//     getAccessToken: () => localStorage.getItem('accessToken'),
//     setAccessToken: (token: string) =>
//         localStorage.setItem('accessToken', token),
//     removeAccessToken: () => localStorage.removeItem('accessToken'),
//
//     getRefreshToken: () => localStorage.getItem('refreshToken'),
//     setRefreshToken: (token: string) =>
//         localStorage.setItem('refreshToken', token),
//     removeRefreshToken: () => localStorage.removeItem('refreshToken'),
//
//     getUser: (): LoggedInUser | null => {
//         // Explicitly type the return
//         const userString = localStorage.getItem('user')
//         if (userString) {
//             // Check if a string value exists
//             try {
//                 // Attempt to parse. If it's "undefined" or not valid JSON, it will throw.
//                 const parsedUser = JSON.parse(userString)
//                 // Optional: Add a check here if parsedUser matches LoggedInUser structure
//                 // if (typeof parsedUser === 'object' && parsedUser !== null && 'id' in parsedUser && 'username' in parsedUser) {
//                 //    return parsedUser as LoggedInUser;
//                 // }
//                 return parsedUser as LoggedInUser // Cast it
//             } catch (error) {
//                 console.error('Error parsing user from localStorage:', error)
//                 // If parsing fails, remove the invalid item to prevent future errors
//                 localStorage.removeItem('user')
//                 return null
//             }
//         }
//         return null // If userString is null (item doesn't exist)
//     },
//     setUser: (user: LoggedInUser) =>
//         localStorage.setItem('user', JSON.stringify(user)),
//     removeUser: () => localStorage.removeItem('user'),
//
//     clearAll: () => {
//         localStorage.removeItem('accessToken')
//         localStorage.removeItem('refreshToken')
//         localStorage.removeItem('user')
//     },
// }
