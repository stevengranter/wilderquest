// authService.ts
import axios from 'axios'
import {jwtDecode} from 'jwt-decode'
import {handleError} from '@/helpers/errorHandler.js'
import {
    LoginResponse,
    LoginResponseData,
    RegisterResponseData,
} from '@shared/types/authTypes.js'
import {DecodedTokenSchema} from '@/models/token.js'
import {z} from 'zod'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
} from '@shared/schemas/Auth.js'

// Add an interceptor to set the Authorization header
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const authService = {
    async register(
        credentials: z.infer<typeof RegisterRequestSchema>
    ): Promise<RegisterResponseData | undefined> {
        const {email, username, password} = credentials

        try {
            const {data, status} = await axios.post('/api/auth/register', {
                email: email,
                username: username,
                password: password,
            })

            if (status === 200) {
                return data
            } else {
                handleError(Error(`Unexpected response status: ${status}`))
            }
        } catch (error) {
            handleError(error)
        }
    },

    async login(
        credentials: z.infer<typeof LoginRequestSchema>
    ): Promise<LoginResponseData | undefined | null> {
        const {username, password} = credentials
        try {
            const response = await axios.post('/api/auth/login', {
                username: username,
                password: password,
            })
            const {data, status} = response
            if (!data || status !== 200) {
                handleError({data: 'Could not login user'})
            }
            const {user, user_cuid, access_token, refresh_token} = data
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('user_cuid', user_cuid.toString())
            localStorage.setItem('access_token', access_token.toString())
            console.log('new access token set')
            // axios.defaults.headers.common['authorization'] = 'Bearer ' + access_token; // Update Axios headers
            localStorage.setItem('refresh_token', refresh_token.toString())
            return data
        } catch (error) {
            handleError(error)
        }
        return null
    },

    async logout(user_cuid?: string): Promise<boolean | undefined> {
        try {
            if (user_cuid) {
                const {data, status} = await axios.post('/api/auth/logout', {
                    user_cuid: user_cuid,
                })
                if (!data || status !== 204) {
                    console.log('Could not logout user')
                }
            }
            localStorage.removeItem('user_cuid')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            return true
        } catch (err) {
            handleError(err)
        }
    },

    async refreshAccessToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token')
            const user_cuid = localStorage.getItem('user_cuid')
            if (!refreshToken || !user_cuid) {
                console.warn(
                    'No refresh token found. UserSchema needs to re-authenticate.'
                )
                // Handle case where there's no refresh token.  Maybe redirect to login?
                // Example:  window.location.href = "/login";
                handleError('No refresh token found') // Crucial to throw an
                // error here!
                return
            }

            const response = await axios.post<{
                access_token: string
            }>('/api/refresh', {
                user_cuid: user_cuid,
                refresh_token: refreshToken,
            })

            console.log(response)

            if (response.status !== 200 || !response.data.access_token) {
                console.error(
                    'Failed to refresh access token.  Status:',
                    response.status
                )
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token') // Also clear
                // refresh token
                // Handle case where token refresh fails (e.g., invalid refresh token)
                // Example: window.location.href = "/login";
                handleError(
                    `Token refresh failed with status: ${response.status}`
                ) //Crucial to throw an error here
            }

            const newAccessToken = response.data.access_token
            localStorage.setItem('access_token', newAccessToken) // Update
            console.log('new access token set')
            // axios.defaults.headers.common['authorization'] = 'Bearer ' + newAccessToken; // Update Axios headers
        } catch (error: any) {
            //Important to type error correctly
            console.error('Error during token refresh:', error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token') // Also clear refresh
            // token
            // Handle the error more gracefully.  Redirect to login, display an error message, etc.
            //  Re-throw the error so the caller can handle it if needed.
            handleError(error) // Crucial to throw an error if you want the calling
            // function to know about the failure!
        }
        // Don't return a id for a void function
    },

    verifyToken(token: string | null) {
        if (token) {
            const decodedToken: any = jwtDecode(token) //Use any type to silence the warning and parse using Zod
            const parsedToken = DecodedTokenSchema.safeParse(decodedToken)

            if (parsedToken.error) {
                console.error(
                    'Token decoding error:',
                    parsedToken.error.message
                )
                // Optionally: Consider the token invalid if decoding fails.
                return false // Exit the function
            }

            const currentTime = Date.now() / 1000

            if (parsedToken.data.exp > currentTime) {
                // Token is valid
                // axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                return true
            } else {
                // Token expired
                this.refreshAccessToken()
                    .then(() => {
                        console.log('New access token granted')
                        //Consider removing these side-effects
                        // After a successful refresh, you might want to re-verify the token
                        //  or retry the original API call that triggered the token expiration.
                        this.verifyToken(localStorage.getItem('access_token')) // Example: Re-verify
                    })
                    .catch((error: any) => {
                        // VERY IMPORTANT: Handle the refresh token failure here
                        console.error('Token refresh failed:', error)
                        // Clear tokens from local storage (since refresh failed)
                        localStorage.removeItem('access_token')
                        localStorage.removeItem('refresh_token')

                        // Redirect to login page or display an error message to the user
                        //window.location.href = "/login"; // Example redirect

                        // Or:
                        alert('Your session has expired. Please log in again.')
                    })
            }
        }
    },
}

export default authService
