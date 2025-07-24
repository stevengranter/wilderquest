import type { RequestHandler } from 'express'
import { Router } from 'express'
import { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

interface AuthController {
    register: RequestHandler
    login: RequestHandler
    logout: RequestHandler
    handleRefreshToken: RequestHandler
}

export function authRouter(controller: AuthController) {
    const router = Router()

    router.post('/register', controller.register)
    router.post('/login', controller.login)
    router.post('/logout', controller.logout)
    router.post('/refresh', controller.handleRefreshToken)
    router.get('/test-auth', optionalAuthMiddleware, (req, res) => {
        res.status(200).json({ message: 'Authentication successful' })
    })

    return router
}
