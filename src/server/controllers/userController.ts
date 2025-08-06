import { type Request, type Response } from 'express'
import { UserService } from '../services/userService.js'

export type UserController = ReturnType<typeof createUserController>

export function createUserController(userService: UserService) {
    return {
        getUserById: async (req: Request, res: Response) => {
            const userId = Number(req.params.id)
            const user = await userService.getUserProfileById(userId)
            res.json(user)
        },

        getUserByUsername: async (req: Request, res: Response) => {
            const username = req.params.username
            const user = await userService.getUserProfileByUsername(username)
            res.json(user)
        },
    }
}
