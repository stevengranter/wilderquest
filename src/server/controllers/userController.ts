// src/controllers/userController.ts
import { Request, Response } from 'express'
import { UserRepository } from '../repositories/UserRepository.js'
import { AppError } from '../middlewares/errorHandler.js'

export function createUserController(userRepository: UserRepository) {
    async function getUserByUsername(req: Request, res: Response) {
        const username = req.params.username

        const user = await userRepository.findUserForDisplay({ username })
        if (!user) throw new AppError('User not found', 404)

        res.status(200).json(user)
    }

    return {
        getUserByUsername,
    }
}

export type UserController = ReturnType<typeof createUserController>
