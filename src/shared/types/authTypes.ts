// types/authTypes.d.ts

import {AxiosResponse} from "axios";


export interface RegisterResponseData {
    user_cuid: string;
    message: string;
}

export interface RegisterResponse extends AxiosResponse {
    data: RegisterResponseData;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponseData {
    user_cuid: string;
    access_token: string;
    refresh_token: string;
}

export interface LoginResponse extends AxiosResponse{
    data: LoginResponseData;
}

export interface RefreshTokenRequest {
    refresh_token: string;
    user_cuid: string;
}

interface RefreshTokenResponseData {
    access_token: string
}

export interface RefreshTokenResponse extends AxiosResponse{
    data: RefreshTokenResponseData
}
