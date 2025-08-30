// src/controllers/authController.ts
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { LoginRequestSchema, RefreshReqBodySchema, RegisterRequestSchema } from '@shared/schemas/Auth.js'
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { AuthService } from '../services/authService.js'
import { AppError } from '../middlewares/errorHandler.js' // make sure to export AppError

export function createAuthController(authService: AuthService) {
    return {
        // Register a new user and login
        async register(req: Request, res: Response) {
            const { username, email, password } = RegisterRequestSchema.parse(req.body); // throws ZodError automatically
            const loggedInUser = await authService.registerAndLogin(username, email, password);
            res.status(201).json(loggedInUser);
        },

        // Login an existing user
        async login(req: Request, res: Response) {
            const { username, password } = LoginRequestSchema.parse(req.body); // throws ZodError automatically
            const user = await authService.login(username, password);

            if (!user) throw new AppError('Invalid username or password', 401);

            res.status(200).json(user);
        },

        // Logout user
        async logout(req: AuthenticatedRequest, res: Response) {
            if (!req.user?.id) throw new AppError('No user authenticated', 400);
            await authService.logout(req.user.id);
            res.status(200).json({ message: 'Logged out successfully' });
        },

        // Handle refresh token flow
        async handleRefreshToken(req: Request, res: Response) {
            const { user_cuid, refresh_token } = RefreshReqBodySchema.parse(req.body);

            if (!user_cuid || !refresh_token)
                throw new AppError('Invalid refresh token or user not found', 400);

            const { accessToken, refreshToken } = await authService.refreshAccessToken(
                user_cuid,
                refresh_token
            );

            res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        },

        // Test auth / token validity
        async testAuth(req: AuthenticatedRequest, res: Response) {
            const authHeader = req.headers.authorization;
            if (!authHeader) throw new AppError('No authorization header', 401);

            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as jwt.JwtPayload;
                const now = Math.floor(Date.now() / 1000);
                const timeRemaining = decoded.exp ? decoded.exp - now : 0;

                res.status(200).json({
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
                });
            } catch (error) {
                if (error instanceof jwt.TokenExpiredError) throw new AppError('Token has expired', 401);
                if (error instanceof jwt.JsonWebTokenError) throw new AppError('Invalid token', 401);
                throw new AppError(error instanceof Error ? error.message : 'Token validation failed', 401);
            }
        },
    };
}

export type AuthController = ReturnType<typeof createAuthController>;
