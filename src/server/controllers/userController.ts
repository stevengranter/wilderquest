import { Request, Response } from 'express'
import { UserRepositoryInstance } from '../repositories/UserRepository.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export interface UserController {
    getUserById(req: Request, res: Response): void | Promise<void>
    getUserByEmail(req: Request, res: Response): void | Promise<void>
    getUserByUsername(req: Request, res: Response): void | Promise<void>
}

export function createUserController(userRepo: UserRepositoryInstance) {
    return {
        getUserById: asyncHandler(async (req, res) => {
            const user = await userRepo.findRowByColumnAndValue(
                'id',
                Number(req.params.id),
            )
            res.json(user)
        }),

        getUserByEmail: asyncHandler(async (req, res) => {
            const user = await userRepo.findRowByColumnAndValue(
                'email',
                req.params.email,
            )
            res.json(user)
        }),

        getUserByUsername: asyncHandler(async (req, res) => {
            const user = await userRepo.findRowByColumnAndValue(
                'username',
                req.params.username,
            )
            res.json(user)
        }),

        createUser: asyncHandler(async (req, res) => {
            const newUser = await userRepo.create(req.body)
            res.status(201).json(newUser)
        }),
    }
}
