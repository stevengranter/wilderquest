import { Router } from 'express'
import usersController from "../controllers/users.controller.js";
import verifyJWT from "../middleware/verifyJWT.js";

const router = Router()

const users = usersController

router
    .get('/:id', users.getById)
    .get('/me', verifyJWT, users.getByRequestBodyId)
    .get('/:id/collections', users.getCollectionsByUserId)
    .get('/',users.getAll)

export { router as usersRouter }
