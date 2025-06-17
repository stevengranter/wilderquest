// src/routes/collectionRouter.ts
import { Router } from 'express'
import type { CollectionController } from '../controllers/collectionController.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function collectionRouter(controller: CollectionController) {
    const router = Router()

    router.get('/:id', optionalAuthMiddleware, controller.getCollectionById)
    router.get('/', controller.getAllPublicCollections)

    router.post('/', verifyJWT, controller.createCollection)
    router.put('/:id', verifyJWT, controller.updateCollection)
    router.patch('/:id', verifyJWT, controller.updateCollection)


    return router

}

