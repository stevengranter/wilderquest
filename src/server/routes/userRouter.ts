import { Router } from 'express'
import { UserController } from '../controllers/userController.js'
import verifyJWT from '../middlewares/verifyJWT.js'

export function createUserRouter(userController: UserController): Router {
    const router = Router()

    // Search route must come before parameterized routes to avoid conflicts
    router.get('/search', verifyJWT, userController.searchUsers)

    router.get('/:username', userController.getUserByUsername)
    router.get('/:username/stats', userController.getUserStats)

    return router
}
