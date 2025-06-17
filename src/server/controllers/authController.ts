// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express' // Import NextFunction

// Import your Zod schemas for request body validation
import {
    LoginRequestSchema,
    RegisterRequestSchema,
    RefreshReqBodySchema,
} from '../../shared/schemas/Auth.js';

// Import your custom types
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js' // Assuming this is defined

// Import your AuthService and custom error classes
import AuthService, { // Import AuthService class itself
    UserExistsError,
    UserCreationError,
    UserRetrievalError, AuthServiceInstance,
} from '../services/authService.js'


// Function to create the AuthController instance
// It receives an instance of your AuthService (the class, not an interface)
export function createAuthController(authService: AuthServiceInstance) { // Removed AuthController return type annotation
    const controller = { // Removed AuthController type annotation here as well
        async register(req: Request, res: Response, next: NextFunction) {
            const parsed = RegisterRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                const validationError = new Error(parsed.error.message)
                ;(validationError as any).statusCode = 400
                return next(validationError)
            }

            const { username, email, password } = parsed.data

            try {
                const loggedInUser = await authService.registerAndLogin(username, email, password)
                res.status(201).json(loggedInUser)
            } catch (error) {
                next(error)
            }
        },

        async login(req: Request, res: Response, next: NextFunction) { // Added 'next' parameter
            // console.log(req.body); // Keep for debugging if needed

            // 1. Input/Syntactic Validation
            const parsed = LoginRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                const validationError = new Error(parsed.error.message);
                (validationError as any).statusCode = 400
                return next(validationError)
            }

            const { username, password } = parsed.data

            try {
                // Call login method on your authService
                // authService.login should handle finding the user, comparing password, and generating tokens
                const user = await authService.login(username, password)

                if (!user) {
                    res.status(401).json({ message: 'Invalid username or password' })
                    return
                }
                // If successful, send the tokens and user info
                // Make sure your authService.login returns an object like this:
                // { user: { id, cuid, username, email, role_id }, accessToken, refreshToken }
                res.status(200).json(user)

            } catch (error) {
                // Pass errors to the global error handler
                next(error)
            }
        },

        async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) { // Added 'next' parameter
            if (!req.user?.id) {
                // Consider a custom error class for this for consistency
                const notAuthenticatedError = new Error('No user authenticated');
                (notAuthenticatedError as any).statusCode = 400
                return next(notAuthenticatedError)
            }

            try {
                await authService.logout(req.user.id) // Call service method to clear refresh token
                res.status(200).json({ message: 'Logged out successfully' })
            } catch (error) {
                next(error)
            }
        },

        async handleRefreshToken(req: Request, res: Response, next: NextFunction) {
            const parsedBody = RefreshReqBodySchema.safeParse(req.body)

            if (!parsedBody.success) {
                const validationError = new Error(parsedBody.error.message);
                (validationError as any).statusCode = 400
                return next(validationError)
            }

            const { user_cuid, refresh_token } = parsedBody.data

            if (!user_cuid || !refresh_token) {
                const invalidInputError = new Error('Invalid refresh token or user not found');
                (invalidInputError as any).statusCode = 400
                return next(invalidInputError)
            }

            try {
                // Call service method to handle refresh token logic
                // Now, expect an object containing both access_token and refresh_token
                const { accessToken, refreshToken } = await authService.refreshToken(user_cuid, refresh_token)

                // Send both tokens back to the client
                // The client will then update its stored refresh token with the new one
                res.json({
                    access_token: accessToken,
                    refresh_token: refreshToken, // Send the new refresh token back
                })

            } catch (error) {
                // Pass errors (e.g., TokenError, UserNotFoundError) to the global error handler
                next(error)
            }
        },
    };

    return controller
}

// Infer the type of AuthController from the return type of createAuthController
export type AuthController = ReturnType<typeof createAuthController>;
