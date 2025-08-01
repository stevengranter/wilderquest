// src/controllers/authController.ts
import { NextFunction, Request, Response } from 'express' // Import NextFunction
import jwt from 'jsonwebtoken'
// Import your Zod schemas for request body validation
import {
    LoginRequestSchema,
    RefreshReqBodySchema,
    RegisterRequestSchema,
} from '../../shared/schemas/Auth.js'
// Import your custom types
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js' // Assuming this is defined
// Import your AuthService and custom error classes
import { AuthService } from '../services/authService.js'

/**
 * Defines a custom error interface that includes a statusCode property.
 * This is used for errors that should result in a specific HTTP status code.
 */
interface HttpError extends Error {
    statusCode?: number
}

// Function to create the AuthController instance
// It receives an instance of your AuthService (the class, not an interface)
export function createAuthController(authService: AuthService) {
    return {
        async register(req: Request, res: Response, next: NextFunction) {
            const parsed = RegisterRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                // Create a new Error and cast it to HttpError to add statusCode
                const validationError: HttpError = new Error(
                    parsed.error.message
                )
                validationError.statusCode = 400
                return next(validationError)
            }

            const { username, email, password } = parsed.data

            // Express 5 automatically catches rejected promises from async functions
            // and forwards them to the error handling middleware.
            const loggedInUser = await authService.registerAndLogin(
                username,
                email,
                password
            )
            res.status(201).json(loggedInUser)
        },

        async login(req: Request, res: Response, next: NextFunction) {
            // 1. Input/Syntactic Validation
            const parsed = LoginRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                // Create a new Error and cast it to HttpError to add statusCode
                const validationError: HttpError = new Error(
                    parsed.error.message
                )
                validationError.statusCode = 400
                return next(validationError)
            }

            const { username, password } = parsed.data

            // Express 5 automatically catches rejected promises from async functions
            // and forwards them to the error handling middleware.
            const user = await authService.login(username, password)

            if (!user) {
                // For a specific "invalid credentials" scenario, you might still want to
                // send a direct response or throw a specific error that your
                // error handler can catch and map to 401.
                // For simplicity here, we'll send a direct response.
                res.status(401).json({
                    message: 'Invalid username or password',
                })
                return
            }
            res.status(200).json(user)
        },

        async logout(
            req: AuthenticatedRequest,
            res: Response,
            next: NextFunction
        ) {
            if (!req.user?.id) {
                // Create a new Error and cast it to HttpError to add statusCode
                const notAuthenticatedError: HttpError = new Error(
                    'No user authenticated'
                )
                notAuthenticatedError.statusCode = 400
                return next(notAuthenticatedError)
            }

            // Express 5 automatically catches rejected promises from async functions
            // and forwards them to the error handling middleware.
            await authService.logout(req.user.id) // Call service method to clear refresh token
            res.status(200).json({ message: 'Logged out successfully' })
        },

        async handleRefreshToken(
            req: Request,
            res: Response,
            next: NextFunction
        ) {
            const parsedBody = RefreshReqBodySchema.safeParse(req.body)

            if (!parsedBody.success) {
                // Create a new Error and cast it to HttpError to add statusCode
                const validationError: HttpError = new Error(
                    parsedBody.error.message
                )
                validationError.statusCode = 400
                return next(validationError)
            }

            const { user_cuid, refresh_token } = parsedBody.data

            if (!user_cuid || !refresh_token) {
                // Create a new Error and cast it to HttpError to add statusCode
                const invalidInputError: HttpError = new Error(
                    'Invalid refresh token or user not found'
                )
                invalidInputError.statusCode = 400
                return next(invalidInputError)
            }

            // Express 5 automatically catches rejected promises from async functions
            // and forwards them to the error handling middleware.
            const { accessToken, refreshToken } =
                await authService.refreshAccessToken(user_cuid, refresh_token)

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken, // Send the new refresh token back
            })
        },

        async testAuth(req: AuthenticatedRequest, res: Response) {
            const authHeader = req.headers.authorization

            if (!authHeader) {
                return res.status(401).json({
                    status: 'error',
                    message: 'No authorization header',
                    code: 'NO_AUTH_HEADER',
                })
            }

            const token = authHeader.split(' ')[1]

            try {
                const decoded = jwt.verify(
                    token,
                    process.env.ACCESS_TOKEN_SECRET!
                ) as jwt.JwtPayload

                // Calculate remaining time
                const now = Math.floor(Date.now() / 1000)
                const timeRemaining = decoded.exp ? decoded.exp - now : 0

                return res.status(200).json({
                    status: 'success',
                    message: 'Token is valid',
                    tokenInfo: {
                        isValid: true,
                        expiresIn: timeRemaining,
                        exp: decoded.exp,
                        iat: decoded.iat,
                        user: {
                            id: decoded.id,
                            cuid: decoded.cuid,
                            role_id: decoded.role_id,
                        },
                    },
                })
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Token has expired',
                        code: 'TOKEN_EXPIRED',
                        expiredAt: error.expiredAt,
                    })
                }

                if (error instanceof jwt.JsonWebTokenError) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Invalid token',
                        code: 'INVALID_TOKEN',
                        error: error.message,
                    })
                }

                // For any other errors
                return res.status(401).json({
                    status: 'error',
                    message: 'Token validation failed',
                    code: 'TOKEN_VALIDATION_FAILED',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                })
            }
        },
    }
}

// Infer the type of AuthController from the return type of createAuthController
export type AuthController = ReturnType<typeof createAuthController>
