import { LoggedInUser } from '../../shared/types/authTypes'

export const tokenManager = {
    getAccessToken: () => localStorage.getItem('accessToken'),
    setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
    removeAccessToken: () => localStorage.removeItem('accessToken'),

    getRefreshToken: () => localStorage.getItem('refreshToken'),
    setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
    removeRefreshToken: () => localStorage.removeItem('refreshToken'),

    getUser: () => {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    },
    setUser: (user: LoggedInUser) => localStorage.setItem('user', JSON.stringify(user)),
    removeUser: () => localStorage.removeItem('user'),

    clearAll: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
    },
}