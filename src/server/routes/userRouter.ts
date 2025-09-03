import { Router } from 'express'
import { UserController } from '../controllers/userController.js'

export function createUserRouter(userController: UserController): Router {
    const router = Router()

    router.get('/:username', userController.getUserByUsername)
    router.get('/:username/stats', userController.getUserStats)

    return router
}
