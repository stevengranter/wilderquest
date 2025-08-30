import { Router } from 'express'
import { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'
import { type AuthController } from '../controllers/authController.js'

export function createAuthRouter(controller: AuthController) {
    const router = Router()

    router.post('/register', controller.register)
    router.post('/login', controller.login)
    router.post('/logout', controller.logout)
    router.post('/refresh', controller.handleRefreshToken)
    router.get('/test-auth', optionalAuthMiddleware, controller.testAuth)

    return router
}
