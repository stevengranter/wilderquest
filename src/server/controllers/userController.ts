import { type Request, type Response } from 'express'
import { UserRepository } from '../repositories/UserRepository.js'

export interface UserController {
    getUserById(req: Request, res: Response): void | Promise<void>
    getUserByEmail(req: Request, res: Response): void | Promise<void>
    getUserByUsername(req: Request, res: Response): void | Promise<void>
}

export function createUserController(userRepo: UserRepository) {
    return {
        getUserById: async (req: Request, res: Response) => {
            const userId = Number(req.params.id)
            const user = await userRepo.findUser({ id: userId })
            res.json(user)
        },

        getUserByUsername: async (req: Request, res: Response) => {
            const username = req.params.username
            const user = await userRepo.findUser({ username: username })
            res.json(user)
        },

        createUser: async (req: Request, res: Response) => {
            const newUser = await userRepo.create(req.body)
            res.status(201).json(newUser)
        },
    }
}
