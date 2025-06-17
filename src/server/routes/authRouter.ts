import { Router } from 'express'
import type { RequestHandler } from 'express'

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
    // router.post('/logout', controller.logout)
    // router.post('/refresh', controller.handleRefreshToken)

    return router
}
