import { Router } from 'express'
import usersController from '../controllers/users.controller.js'
import verifyJWT from '../middleware/verifyJWT.js'

const router = Router()

router
    .get('/', usersController.getAllUsers)
    .post('/', usersController.createNewUser)
    .patch('/', verifyJWT, usersController.updateUser)
    .delete('/', usersController.deleteUser)

export { router as usersRouter }
