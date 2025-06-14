import { Request, Response } from 'express'
import { UserRepositoryInstance } from '../repositories/UserRepository.js' // adjust import path

export interface UserController {
    getUserById(req: Request, res: Response): void | Promise<void>

    getUserByEmail(req: Request, res: Response): void | Promise<void>

    getUserByUsername(req: Request, res: Response): void | Promise<void>
}

export function createUserController(userRepo: UserRepositoryInstance) {
    return {
        async getUserById(req: Request, res: Response) {
            try {
                const user = await userRepo.getUserByField('id', Number(req.params.id))
                res.json(user)
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch user by ID' })
            }
        },

        async getUserByEmail(req: Request, res: Response) {
            try {
                const user = await userRepo.getUserByField('email', req.params.email)
                res.json(user)
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch user by email' })
            }
        },

        async getUserByUsername(req: Request, res: Response) {
            try {
                const user = await userRepo.getUserByField('username', req.params.username)
                res.json(user)
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch user by username' })
            }
        },

        async createUser(req: Request, res: Response) {
            try {
                const newUser = await userRepo.create(req.body) // assuming this exists
                res.status(201).json(newUser)
            } catch (error) {
                res.status(500).json({ error: 'Failed to create user' })
            }
        },

        // Add more as needed
    }
}
