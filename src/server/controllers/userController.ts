import { Request, Response } from 'express'
import { UserRepository } from '../repositories/UserRepository.js'


export function createUserController(userRepository: UserRepository) {
    async function getUserByUsername(req: Request, res: Response) {
        const username = req.params.username

        try {
            const user = await userRepository.findUser({ username })
            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }
            res.status(200).json(user)
        } catch (_error) {
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    return {
        getUserByUsername,
    }
}

export type UserController = ReturnType<typeof createUserController>
