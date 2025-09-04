// src/controllers/userController.ts
import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { UserService } from '../services/userService.js'
import { AppError } from '../middlewares/errorHandler.js'

export function createUserController(userService: UserService) {
    async function getUserByUsername(req: AuthenticatedRequest, res: Response) {
        const username = req.params.username

        const user = await userService.getUserProfileByUsername(username)
        if (!user) throw new AppError('User not found', 404)

        res.status(200).json(user)
    }

    async function searchUsers(req: AuthenticatedRequest, res: Response) {
        const { q: query, limit, offset } = req.query
        const userId = req.user?.id // From auth middleware

        if (!query || typeof query !== 'string') {
            throw new AppError('Search query is required', 400)
        }

        const limitNum = limit ? parseInt(limit as string, 10) : 20
        const offsetNum = offset ? parseInt(offset as string, 10) : 0

        if (isNaN(limitNum) || isNaN(offsetNum)) {
            throw new AppError('Invalid limit or offset', 400)
        }

        const result = await userService.searchUsers(query, {
            limit: limitNum,
            offset: offsetNum,
            excludeUserId: userId, // Exclude current user from results
        })

        if (!result) {
            return res.status(200).json({
                users: [],
                pagination: { total: 0, limit: limitNum, offset: offsetNum },
            })
        }

        res.status(200).json({
            users: result.users,
            pagination: {
                total: result.total,
                limit: limitNum,
                offset: offsetNum,
            },
        })
    }

    async function getUserStats(req: AuthenticatedRequest, res: Response) {
        const username = req.params.username

        const stats = await userService.getUserStats(username)
        if (!stats) throw new AppError('User not found', 404)

        res.status(200).json(stats)
    }

    return {
        getUserByUsername,
        searchUsers,
        getUserStats,
    }
}

export type UserController = ReturnType<typeof createUserController>
