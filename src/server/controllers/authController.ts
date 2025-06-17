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
    UserRetrievalError,
} from '../services/authService.js'

// Define the interface for your AuthController
export interface AuthController {
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>; // Add next to interface
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>; // Add next
    logout: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>; // Add next
    handleRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>; // Add next
}

// Function to create the AuthController instance
// It receives an instance of your AuthService (the class, not an interface)
export function createAuthController(authService: AuthService): AuthController {
    const controller: AuthController = {
        async register(req, res, next) {
            // 1. Input/Syntactic Validation (using Zod and `next()`)
            const parsed = RegisterRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                // If validation fails, pass the error to the global error handler
                // You might want a custom ValidationError class for this.
                // For now, a generic error or a specific message is fine.
                const validationError = new Error(parsed.error.message);
                (validationError as any).statusCode = 400 // Custom property for status code
                return next(validationError)
            }

            const parsedUserData = parsed.data

            try {
                // 2. Call the Service Layer
                const newUser = await authService.registerUser(parsedUserData)

                // 3. Send success response (only if no error was thrown)
                res.status(201).json(newUser)
            } catch (error) {
                // 4. Catch errors from the Service Layer and pass to `next()`
                // The global error handler will then map these to appropriate HTTP responses.
                next(error)
            }
        },

        async login(req, res, next) { // Added 'next' parameter
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
                const loginResult = await authService.login(username, password)

                // If successful, send the tokens and user info
                // Make sure your authService.login returns an object like this:
                // { user: { id, cuid, username, email, role_id }, accessToken, refreshToken }
                res.status(200).json({
                    user: loginResult.user,
                    user_cuid: loginResult.user.user_cuid, // Assuming user.user_cuid
                    access_token: loginResult.accessToken,
                    refresh_token: loginResult.refreshToken,
                })

            } catch (error) {
                // Pass errors to the global error handler
                next(error)
            }
        },

        async logout(req: AuthenticatedRequest, res, next: NextFunction) { // Added 'next' parameter
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

        async handleRefreshToken(req, res, next: NextFunction) { // Added 'next' parameter
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
                const newAccessToken = await authService.refreshToken(user_cuid, refresh_token)
                res.json({ access_token: newAccessToken })
            } catch (error) {
                next(error)
            }
        },
    };

    return controller
}

// --- IMPORTANT: Global Error Handler ---
// You will also need a global error handling middleware in your main Express app file (e.g., app.ts or index.ts)
/*
// Example: In your app.ts
import { Request, Response, NextFunction } from 'express';
import { UserExistsError, UserCreationError, UserRetrievalError } from './services/authService.js'; // Adjust path

// Define a general error interface if you add custom status codes
interface HttpError extends Error {
    statusCode?: number;
}

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler caught an error:', err); // Log the full error for debugging

    // Check if headers have already been sent to prevent the "Cannot set headers" error
    if (res.headersSent) {
        return next(err); // Pass to default Express error handler if headers are already sent
    }

    // Map your custom errors to HTTP status codes
    if (err instanceof UserExistsError) {
        return res.status(409).json({ message: err.message }); // 409 Conflict
    }
    if (err instanceof UserCreationError || err instanceof UserRetrievalError) {
        return res.status(500).json({ message: err.message }); // 500 Internal Server Error
    }
    // Handle validation errors from the controller
    if ((err as any).statusCode === 400) { // Check custom statusCode property
        return res.status(400).json({ message: err.message }); // 400 Bad Request
    }

    // Generic fallback for any other unhandled errors
    return res.status(500).json({ message: 'An unexpected internal server error occurred.' });
});
*/