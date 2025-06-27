// types/authTypes.d.ts

import { AxiosResponse } from 'axios'

export interface RegisterResponseData {
    userCuid: string
    message: string
}

export interface RegisterResponse extends AxiosResponse {
    data: RegisterResponseData
}

export interface LoginRequest {
    username: string
    password: string
}

export type LoggedInUser = {
    id: number
    username: string
    email: string
    role: number
    cuid: string
}

export interface LoginResponseData {
    success: boolean
    message?: string
    user: LoggedInUser
    access_token: string
    refresh_token: string
}

export interface LoginResponse extends AxiosResponse {
    data: LoginResponseData
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
