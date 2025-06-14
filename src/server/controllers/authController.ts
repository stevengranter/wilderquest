// src/controllers/authController.ts
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { genSaltSync, hashSync, compareSync } from 'bcrypt-ts'
import { createId } from '@paralleldrive/cuid2'
import { LoginRequestSchema, RegisterRequestSchema } from '../../shared/schemas/Auth.js'
import type { LoginRequestBody } from '../../types/types.js'
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import type { User } from '../models/User.js'
import { UserRepositoryInstance } from '../repositories/UserRepository.js'

// interface IUserRepository {
//     getUsersByEmail(email: string): Promise<User[]>
//     getUsersByUsername(username: string): Promise<User[]>
//     create(user: Partial<User>): Promise<number | undefined>
//     findOne(query: { id?: number; username?: string }): Promise<User | null>
//     update(id: number, data: Partial<User>): Promise<User>
// }

export interface AuthController {
    register: (req: Request, res: Response) => Promise<void>
    login: (req: Request, res: Response) => Promise<void>
    logout: (req: AuthenticatedRequest, res: Response) => Promise<void>
}

interface AuthControllerDependencies {
    userRepository: UserRepositoryInstance
}

export function createAuthController({ userRepository }: AuthControllerDependencies): AuthController {
    return {
        async register(req, res) {
            const parsed = RegisterRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                res.status(400).send(parsed.error.message)
                return
            }

            const { username, email, password } = parsed.data

            const emailExists = (await userRepository.getUsersByEmail(email)).length > 0
            const usernameExists = (await userRepository.getUsersByUsername(username)).length > 0

            if (emailExists || usernameExists) {
                res.status(409).json({ message: 'Username and/or email already exists' })
                return
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

            const user_id = await userRepository.create(newUser)

            if (!user_id) {
                res.status(500).json({ message: 'Failed to create user' })
                return
            }

            const createdUser = await userRepository.findOne({ id: user_id })

            if (!createdUser) {
                res.status(500).json({ message: 'User created but not retrievable' })
                return
            }

            // Perform login
            req.body = { username, password } as LoginRequestBody
            return this.login(req, res)
        },

        async login(req, res) {
            const parsed = LoginRequestSchema.safeParse(req.body)
            if (!parsed.success) {
                res.status(400).send(parsed.error.message)
                return
            }

            const { username, password } = parsed.data
            const user = await userRepository.findOne({ username })

            if (!user || !compareSync(password, user.password)) {
                res.status(401).json({ message: 'Invalid credentials' })
                return
            }

            const access_token = jwt.sign(
                { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
                process.env.ACCESS_TOKEN_SECRET!,
                { expiresIn: '300s' },
            )

            const refresh_token = jwt.sign(
                { id: user.id, cuid: user.user_cuid, role_id: user.role_id },
                process.env.REFRESH_TOKEN_SECRET!,
                { expiresIn: '1h' },
            )

            if (!user.id) {
                res.status(400).json({ message: 'No user authenticated' })
                return
            }
            await userRepository.update(user.id, { refresh_token })

            res.status(200).json({
                user: {
                    id: user.id,
                    cuid: user.user_cuid,
                    username: user.username,
                    email: user.email,
                    role_id: user.role_id,
                },
                user_cuid: user.user_cuid,
                access_token,
                refresh_token,
            })
        },

        async logout(req, res) {
            if (!req.user?.id) {
                res.status(400).json({ message: 'No user authenticated' })
                return
            }

            await userRepository.update(req.user.id, { refresh_token: null })
            res.status(200).json({ message: 'Logged out successfully' })
        },
    }
}
