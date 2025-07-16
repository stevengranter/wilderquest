// Define custom error classes for better error handling

import { createId } from '@paralleldrive/cuid2'
import { compareSync, genSaltSync, hashSync } from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { UserRepositoryInstance } from '../repositories/UserRepository.js'
import env from '../config/app.config.js'

// Ensure your environment variables are correctly loaded
// For a real application, consider a configuration library (e.g., dotenv)
// env.ACCESS_TOKEN_SECRET
// env.REFRESH_TOKEN_SECRET

type PublicUser = {
    username: string
    email: string
    user_cuid: string
    role_id: number
}

export class UserExistsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserExistsError'
    }
}

export class UserNotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserNotFoundError'
    }
}

export class UserCreationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserCreationError'
    }
}

export class UserRetrievalError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserRetrievalError'
    }
}

export class UserPasswordError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserPasswordError'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthenticationError'
    }
}

// New error for token issues
export class TokenError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TokenError'
    }
}

// Instantiate a InstanceType for TypeScript completions
type AuthServiceConstructor = typeof AuthService
export type AuthServiceInstance = InstanceType<AuthServiceConstructor>

export default class AuthService {
    constructor(private userRepository: UserRepositoryInstance) {
        // Ensure environment variables are set before proceeding
        if (
            !env.ACCESS_TOKEN_SECRET ||
            !env.REFRESH_TOKEN_SECRET
        ) {
            console.error(
                'Missing ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET environment variables.',
            )
            // In a real app, you might want to throw an error or handle this more gracefully
            // For now, it's a console error to highlight the issue.
        }
    }

    register = async (
        username: string,
        email: string,
        password: string,
    ): Promise<{
        username: string
        email: string | undefined
        user_cuid: string
        role_id: number
    }> => {
        const emailExists =
            (await this.userRepository.findRowByColumnAndValue('email', email))
                .length > 0
        const usernameExists =
            (
                await this.userRepository.findRowByColumnAndValue(
                    'username',
                    username,
                )
            ).length > 0

        if (emailExists || usernameExists) {
            // Throw a custom error instead of sending a response
            throw new UserExistsError('Username and/or email already exists')
        }

        const hashedPassword = hashSync(password, genSaltSync(10))
        const userCuid = createId()

        const newUser = {
            username,
            email,
            password: hashedPassword,
            user_cuid: userCuid,
            role_id: 1, // Default role_id, adjust as needed
        }

        const user_id = await this.userRepository.create(newUser)

        if (!user_id) {
            // Throw an error if user creation fails
            throw new UserCreationError('Failed to create user')
        }

        const createdUser = await this.userRepository.findOne({ id: user_id })

        if (!createdUser) {
            // Throw an error if the user can't be retrieved after creation
            throw new UserRetrievalError('User created but not retrievable')
        }

        // Return the created user object
        return {
            username: createdUser.username,
            email: createdUser.email,
            user_cuid: createdUser.user_cuid,
            role_id: createdUser.role_id,
        }
    }

    login = async (username: string, password: string) => {
        // Added type annotations for clarity

        const foundUser = (await this.userRepository.findRowByColumnAndValue(
            'username',
            username,
        )) as User[]
        if (foundUser.length === 0) {
            throw new UserNotFoundError('User not found')
        }
        const user = foundUser[0]
        const isPasswordSame = compareSync(password, user.password)
        if (!isPasswordSame) {
            throw new UserPasswordError('Password is incorrect')
        }

        // Only proceed if password is correct
        if (isPasswordSame) {
            // Generate access and refresh tokens
            const accessToken = jwt.sign(
                { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
                env.ACCESS_TOKEN_SECRET!,
                { expiresIn: '300s' }, // 5 minutes
            )
            const refreshToken = jwt.sign(
                { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
                env.REFRESH_TOKEN_SECRET!,
                { expiresIn: '1d' }, // 1 day, common for refresh tokens
            )

            // Save refresh token to db
            // It's good practice to hash refresh tokens in the DB, but for now, we'll store as is.
            // If storing as is, ensure your DB column is sufficiently long.
            await this.userRepository.update(user.id, {
                refresh_token: refreshToken,
            })

            return {
                success: true,
                user: {
                    // Nest user details under a 'user' key for consistency with loginResult in controller
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role_id,
                    cuid: user.user_cuid,
                },
                accessToken: accessToken, // Use 'accessToken' for consistency
                refreshToken: refreshToken, // Use 'refreshToken' for consistency
            }
        }
        // Should theoretically not be reached if password is not same due to throw
        return null
    }

    async registerAndLogin(username: string, email: string, password: string) {
        const newUser = await this.register(username, email, password)
        const loggedInUser = await this.login(username, password)

        if (!loggedInUser) {
            throw new AuthenticationError(
                'User registered but failed to authenticate',
            )
        }

        return loggedInUser
    }

    /**
     * Logs out a user by clearing their refresh token in the database.
     * @param user_id The ID of the user to log out.
     */
    logout = async (user_id: number): Promise<void> => {
        try {
            // Clear the refresh token for the specified user
            await this.userRepository.update(user_id, {
                refresh_token: '', // Set to null or an empty string
            })
        } catch (error) {
            console.error(`Error during logout for user ID ${user_id}:`, error)
            throw new Error('Logout failed due to an internal error.')
        }
    }

    /**
     * Handles refresh token logic to issue a new access token.
     * @param user_cuid The CUID of the user associated with the refresh token.
     * @param refreshToken The refresh token provided by the client.
     * @returns A new access token if the refresh token is valid.
     * @throws TokenError if the token is invalid or expired, or user not found.
     */
    refreshToken = async (
        user_cuid: string,
        refreshToken: string,
    ): Promise<{
        accessToken: string
        refreshToken: string
    }> => {
        if (!user_cuid || !refreshToken) {
            throw new TokenError('Missing user CUID or refresh token.')
        }

        const foundUser = (await this.userRepository.findRowByColumnAndValue(
            'user_cuid',
            user_cuid,
        )) as User[]

        if (foundUser.length === 0) {
            throw new UserNotFoundError('User not found for provided CUID.')
        }
        const user = foundUser[0]

        // 1. Check if the refresh token from the request matches the one stored in the database
        if (user.refresh_token !== refreshToken) {
            // This could indicate token theft or an old/invalid token
            // In a real app, you might want to revoke all tokens for this user as a security measure
            throw new TokenError('Invalid refresh token provided.')
        }

        // 2. Verify the refresh token's authenticity and expiration
        let decoded: jwt.JwtPayload
        try {
            decoded = jwt.verify(
                refreshToken,
                env.REFRESH_TOKEN_SECRET!,
            ) as jwt.JwtPayload

            // Optional: Check if the decoded user ID/CUID matches the requested one,
            // though the initial DB lookup already ensures this.
            if (decoded.cuid !== user.user_cuid || decoded.id !== user.id) {
                throw new TokenError('Refresh token payload mismatch.')
            }
        } catch (err) {
            // Token is expired, invalid, or malformed
            // Clear the refresh token from the database if it's expired or invalid
            await this.userRepository.update(user.id, { refresh_token: '' })
            throw new TokenError(
                'Refresh token is invalid or expired. Please log in again.',
            )
        }

        // 3. Generate a new Access Token
        const newAccessToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '300s' }, // 5 minutes
        )

        // Optional: Implement refresh token rotation (issue a new refresh token and invalidate the old one)
        // This is a more advanced security measure to prevent replay attacks.
        // If you implement this, you would also need to update the refresh_token in the DB here.
        // /*
        const newRefreshToken = jwt.sign(
            { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
            env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '1d' },
        )
        await this.userRepository.update(user.id, {
            refresh_token: newRefreshToken,
        })

        return { accessToken: newAccessToken, refreshToken: newRefreshToken }

        // return newAccessToken;
    }
}
