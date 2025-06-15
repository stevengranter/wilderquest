// src/routes/collectionRouter.ts
import { Router } from 'express'
import type { CollectionController } from '../controllers/collectionController.js'
import verifyJWT from '../middlewares/verifyJWT.js'

export function collectionRouter(controller: CollectionController) {
    const router = Router()

    router.get('/:id', controller.getCollectionById)
    router.post('/', verifyJWT, controller.createCollection)
    router.put('/:id', verifyJWT, controller.updateCollection)
    router.patch('/:id', verifyJWT, controller.updateCollection)

    return router
}

