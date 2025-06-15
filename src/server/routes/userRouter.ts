// src/routes/userRouter.ts
import { Router } from 'express'
import type { UserController } from '../controllers/userController.js'

export function userRouter(controller: UserController) {
    const router = Router()

    router.get('/id/:id', controller.getUserById)
    router.get('/email/:email', controller.getUserByEmail)
    router.get('/username/:username', controller.getUserByUsername)

    return router
}
