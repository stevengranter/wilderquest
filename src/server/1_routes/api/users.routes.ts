import { Router } from 'express'
import usersController from '../../2_controllers/users.controller.js'
import verifyJWT from '../../_middleware/verifyJWT.js'

const router = Router()

const users = usersController

router
    .get('/me', verifyJWT, users.getByRequestBodyId)
    .get('/:id', users.getById)
    .get('/:id/collections', users.getCollectionsByUserId)
    .get('/', verifyJWT, users.getAll)

export { router as usersRouter }
