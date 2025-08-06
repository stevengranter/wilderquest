// src/routes/userRouter.ts
import { Request, Response, Router } from 'express'
import type { UserController } from '../controllers/userController.js'

export function userRouter(controller: UserController) {
    const router = Router()

    router.get('/', (req: Request, res: Response) => {
        res.status(200).json({ message: '/users route' })
    })
    router.get('/:username', controller.getUserByUsername)
    router.get('/id/:id', controller.getUserById)
    router.get('/username/:username', controller.getUserByUsername)

    return router
}
