import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
import usersController from '../controllers/users.controller.js'

const router = Router()

router
    .post('/login', authController.handleLogin)
    .post('/register', usersController.createNewUser)

export { router as authRouter }
