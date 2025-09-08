import { createId } from '@paralleldrive/cuid2'
import { compareSync, genSaltSync, hashSync } from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import env from '../config/app.config.js'
import { User, UserRepository } from '../repositories/UserRepository.js'
import { AppError } from '../middlewares/errorHandler.js'

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '1d'

interface AuthenticatedUserResponse {
    success: boolean
    user: {
        id: number
        username: string
        email: string | undefined
        role: number
        cuid: string
    }
    access_token: string
    refresh_token: string
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

        if (emailExists.length || usernameExists.length) {
            throw new AppError('Username and/or email already exists', 400)
        }

        const hashedPassword = hashSync(password, genSaltSync(10))
        const userCuid = createId()

        const userId = await userRepo.create({
            username,
            email,
            password: hashedPassword,
            user_cuid: userCuid,
            role_id: 1,
        })

        if (!userId) throw new AppError('Failed to create user', 500)

        const createdUser = await userRepo.findOne({ id: userId })
        if (!createdUser) throw new AppError('User not retrievable', 500)

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
        if (!users.length) throw new AppError('User not found', 404)

        const user = users[0]
        if (!compareSync(password, user.password))
            throw new AppError('Password is incorrect', 401)

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
            access_token: accessToken,
            refresh_token: refreshToken,
        }
    }

    async function registerAndLogin(
        username: string,
        email: string,
        password: string
    ) {
        await register(username, email, password)
        return login(username, password)
    }

    async function logout(userId: number) {
        await userRepo.update(userId, { refresh_token: '' })
    }

    async function refreshAccessToken(userCuid: string, refreshToken: string) {
        if (!userCuid || !refreshToken)
            throw new AppError('Missing user CUID or refresh token', 400)

        const users = (await userRepo.findRowByColumnAndValue(
            'user_cuid',
            userCuid
        )) as User[]
        if (!users.length) throw new AppError('User not found', 404)

        const user = users[0]
        if (user.refresh_token !== refreshToken)
            throw new AppError('Refresh token does not match', 401)

        try {
            jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!)
        } catch {
            await userRepo.update(user.id, { refresh_token: '' })
            throw new AppError('Refresh token is invalid or expired', 401)
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

        return { access_token: newAccessToken, refresh_token: newRefreshToken }
    }

    return {
        register,
        login,
        registerAndLogin,
        logout,
        refreshAccessToken,
    }
}
