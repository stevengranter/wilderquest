// src/controllers/userController.ts
import { Request, Response } from 'express'
import { UserService } from '../services/userService.js'
import { AppError } from '../middlewares/errorHandler.js'

export function createUserController(userService: UserService) {
    async function getUserByUsername(req: Request, res: Response) {
        const username = req.params.username

        const user = await userService.getUserProfileByUsername(username)
        if (!user) throw new AppError('User not found', 404)

        res.status(200).json(user)
    }

    async function getUserStats(req: Request, res: Response) {
        const username = req.params.username

        const stats = await userService.getUserStats(username)
        if (!stats) throw new AppError('User not found', 404)

        res.status(200).json(stats)
    }

    return {
        getUserByUsername,
        getUserStats,
    }
}

export type UserController = ReturnType<typeof createUserController>
