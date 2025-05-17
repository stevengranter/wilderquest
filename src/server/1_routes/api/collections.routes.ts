import { Router } from 'express'
import collectionsController from '../../2_controllers/collections.controller.js'
import verifyJWT from '../../_middleware/verifyJWT.js'

const router = Router()

router
    .get('/:id', collectionsController.getById)
    .get('/', collectionsController.getAll)
    .post('/', verifyJWT, collectionsController.create)
    .put('/:id', verifyJWT, collectionsController.updateCollection)
    .patch('/:id', verifyJWT, collectionsController.updateCollection)

export { router as collectionsRouter }
