// types/authTypes.d.ts

import { AxiosResponse } from 'axios'

export interface LoggedInUser {
    id: number
    username: string
    email: string | undefined
    role: number
    cuid: string
}

export interface LoginResponseData {
    success: boolean
    user: LoggedInUser
    access_token: string
    refresh_token: string
}

export interface RegisterResponseData {
    success: boolean
    user: LoggedInUser
    access_token: string
    refresh_token: string
}

export interface RefreshTokenRequest {
    refresh_token: string
    user_cuid: string
}

interface RefreshTokenResponseData {
    access_token: string
}

export interface RefreshTokenResponse extends AxiosResponse {
    data: RefreshTokenResponseData
}
