import { createId } from '@paralleldrive/cuid2'
import { compareSync, genSaltSync, hashSync } from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import env from '../config/app.config.js'
import { User } from '../models/user.js'
import { UserRepository } from '../repositories/UserRepository.js'

// Constants
const ACCESS_TOKEN_EXPIRES_IN = '60s'
const REFRESH_TOKEN_EXPIRES_IN = '1d'

// Error classes
export class UserExistsError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'UserExistsError'
    }
}
export class UserNotFoundError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'UserNotFoundError'
    }
}
export class UserCreationError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'UserCreationError'
    }
}
export class UserRetrievalError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'UserRetrievalError'
    }
}
export class UserPasswordError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'UserPasswordError'
    }
}
export class AuthenticationError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'AuthenticationError'
    }
}
export class TokenError extends Error {
    constructor(msg: string) {
        super(msg)
        this.name = 'TokenError'
    }
}

// Types
interface AuthenticatedUserResponse {
    success: boolean
    user: {
        id: number
        username: string
        email: string | undefined
        role: number
        cuid: string
    }
    accessToken: string
    refreshToken: string
}
export type AuthService = ReturnType<typeof createAuthService>

export function createAuthService(userRepo: UserRepository) {
    if (!env.ACCESS_TOKEN_SECRET || !env.REFRESH_TOKEN_SECRET) {
        console.error('Missing ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET')
    }

    async function register(username: string, email: string, password: string) {
        const [emailExists, usernameExists] = await Promise.all([
            userRepo.findRowByColumnAndValue('email', email),
            userRepo.findRowByColumnAndValue('username', username),
        ])

        if (emailExists.length > 0 || usernameExists.length > 0) {
            throw new UserExistsError('Username and/or email already exists')
        }

        const hashedPassword = hashSync(password, genSaltSync(10))
        const userCuid = createId()
        const newUser = {
            username,
            email,
            password: hashedPassword,
            user_cuid: userCuid,
            role_id: 1,
        }

        const userId = await userRepo.create(newUser)
        if (!userId) throw new UserCreationError('Failed to create user')

        const createdUser = await userRepo.findOne({ id: userId })
        if (!createdUser) throw new UserRetrievalError('User not retrievable')

        return {
            username: createdUser.username,
            email: createdUser.email,
            user_cuid: createdUser.user_cuid,
            role_id: createdUser.role_id,
        }
    }

    async function login(
        username: string,
        password: string
    ): Promise<AuthenticatedUserResponse> {
        const users = (await userRepo.findRowByColumnAndValue(
            'username',
            username
        )) as User[]
        if (users.length === 0) throw new UserNotFoundError('User not found')

        const user = users[0]
        if (!compareSync(password, user.password)) {
            throw new UserPasswordError('Password is incorrect')
        }

        const accessToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.ACCESS_TOKEN_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
        )

        const refreshToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.REFRESH_TOKEN_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        )

        await userRepo.update(user.id, { refresh_token: refreshToken })

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role_id,
                cuid: user.user_cuid,
            },
            accessToken,
            refreshToken,
        }
    }

    async function registerAndLogin(
        username: string,
        email: string,
        password: string
    ): Promise<AuthenticatedUserResponse> {
        await register(username, email, password)
        const result = await login(username, password)
        if (!result)
            throw new AuthenticationError(
                'User registered but not authenticated'
            )
        return result
    }

    async function logout(userId: number): Promise<void> {
        try {
            await userRepo.update(userId, { refresh_token: '' })
        } catch (err) {
            console.error(`Logout error for user ${userId}:`, err)
            throw new Error('Logout failed due to internal error.')
        }
    }

    async function refreshAccessToken(
        userCuid: string,
        refreshToken: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        if (!userCuid || !refreshToken)
            throw new TokenError('Missing user CUID or refresh token')

        const users = (await userRepo.findRowByColumnAndValue(
            'user_cuid',
            userCuid
        )) as User[]
        if (users.length === 0) throw new UserNotFoundError('User not found')

        const user = users[0]
        if (user.refresh_token !== refreshToken) {
            throw new TokenError('Refresh token does not match stored token.')
        }

        try {
            jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!)
        } catch {
            await userRepo.update(user.id, { refresh_token: '' })
            throw new TokenError('Refresh token is invalid or expired.')
        }

        const newAccessToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.ACCESS_TOKEN_SECRET!,
            { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
        )

        const newRefreshToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.REFRESH_TOKEN_SECRET!,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        )

        await userRepo.update(user.id, { refresh_token: newRefreshToken })

        return { accessToken: newAccessToken, refreshToken: newRefreshToken }
    }

    return {
        register,
        login,
        registerAndLogin,
        logout,
        refreshAccessToken,
    }
}
