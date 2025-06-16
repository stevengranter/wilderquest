// src/controllers/authController.ts
import { Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { genSaltSync, hashSync, compareSync } from 'bcrypt-ts'
import { createId } from '@paralleldrive/cuid2'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
    RefreshReqBodySchema,
} from '../../shared/schemas/Auth.js'
import type { LoginRequestBody } from '../../types/types.js'
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import type { UserRepositoryInstance } from '../repositories/UserRepository.js'
import { AuthServiceInstance } from '../services/authService.js'

export interface AuthController {
    register: (req: Request, res: Response) => Promise<void>
    // login: (req: Request, res: Response) => Promise<void>
    // logout: (req: AuthenticatedRequest, res: Response) => Promise<void>
    // handleRefreshToken: (req: Request, res: Response) => Promise<void>
}

export function createAuthController(authService: AuthServiceInstance): AuthController {
    const controller: AuthController = {
        async register(req, res) {
            const parsed = RegisterRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                res.status(400).send(parsed.error.message)
                return
            }

            const parsedUserData = parsed.data
            const newUser = await authService.registerUser(parsedUserData)
            console.log('newUser: ', newUser)
        },

        //     async login(req, res) {
        //         console.log(req.body)
        //         const parsed = LoginRequestSchema.safeParse(req.body)
        //         if (!parsed.success) {
        //             res.status(400).send(parsed.error.message)
        //             return
        //         }
        //
        //         const { username, password } = parsed.data
        //         const user = await userRepository.findOne({ username })
        //
        //         if (!user || !compareSync(password, user.password)) {
        //             res.status(401).json({ message: 'Invalid credentials' })
        //             return
        //         }
        //
        //         const access_token = jwt.sign(
        //             { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
        //             process.env.ACCESS_TOKEN_SECRET!,
        //             { expiresIn: '300s' },
        //         )
        //
        //         const refresh_token = jwt.sign(
        //             { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
        //             process.env.REFRESH_TOKEN_SECRET!,
        //             { expiresIn: '1h' },
        //         )
        //
        //         if (!user.id) {
        //             res.status(400).json({ message: 'No user authenticated' })
        //             return
        //         }
        //
        //         await userRepository.update(user.id, { refresh_token })
        //
        //         res.status(200).json({
        //             user: {
        //                 id: user.id,
        //                 cuid: user.user_cuid,
        //                 username: user.username,
        //                 email: user.email,
        //                 role_id: user.role_id,
        //             },
        //             user_cuid: user.user_cuid,
        //             access_token,
        //             refresh_token,
        //         })
        //     },
        //
        //     async logout(req: AuthenticatedRequest, res) {
        //         if (!req.user?.id) {
        //             res.status(400).json({ message: 'No user authenticated' })
        //             return
        //         }
        //
        //         await userRepository.update(req.user.id, { refresh_token: null })
        //         res.status(200).json({ message: 'Logged out successfully' })
        //     },
        //
        //     async handleRefreshToken(req, res) {
        //         const parsedBody = RefreshReqBodySchema.safeParse(req.body)
        //
        //         if (!parsedBody.success) {
        //             res.status(400).send(parsedBody.error.message)
        //             return
        //         }
        //
        //         const { user_cuid, refresh_token } = parsedBody.data
        //
        //         if (!user_cuid || !refresh_token) {
        //             res.status(400).send({ message: 'Invalid refresh token or user not found' })
        //             return
        //         }
        //
        //         const foundUser = await userRepository.findOne({ user_cuid, refresh_token })
        //
        //         if (!foundUser) {
        //             res.status(403).send({ message: 'Invalid refresh token or user not found' })
        //             return
        //         }
        //
        //         jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET!, (err, decoded) => {
        //             if (
        //                 err ||
        //                 typeof decoded !== 'object' ||
        //                 decoded === null ||
        //                 !('cuid' in decoded) ||
        //                 foundUser.user_cuid !== (decoded as JwtPayload).cuid
        //             ) {
        //                 res.status(403).send({ message: 'Refresh token expired or invalid' })
        //                 return
        //             }
        //
        //             const payload = decoded as JwtPayload
        //
        //             const access_token = jwt.sign(
        //                 { cuid: payload.cuid, role_id: payload.role_id },
        //                 process.env.ACCESS_TOKEN_SECRET!,
        //                 { expiresIn: '30s' },
        //             )
        //
        //             res.json({ access_token })
        //         })
        //     },
    }

    return controller
}
