// src/routes/collectionRouter.ts
import { Router } from 'express'
import type { CollectionController } from '../controllers/index.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function createCollectionRouter(controller: CollectionController) {
    const router = Router()

    // Public: Get all public collections (globally)
    router.get('/', controller.getAllPublicCollections)

    // Authenticated: Get collections owned by the authenticated user (public or private)
    router.get('/mine', verifyJWT, controller.getPublicCollectionsByUserId)

    router.get(
        '/user/:user_id/',
        optionalAuthMiddleware,
        controller.getPublicCollectionsByUserId
    ) // No auth needed, it's public info
    // Public: Get a single collection by ID (if it's public or user owns it)
    router.get('/:id', optionalAuthMiddleware, controller.getCollectionById)

    router.put('/:id/taxa', verifyJWT, controller.updateCollectionTaxa)
    router.patch('/:id/taxa', verifyJWT, controller.updateCollectionTaxa)

    router.post('/', verifyJWT, controller.createCollection)
    router.put('/:id', verifyJWT, controller.updateCollection)
    router.patch('/:id', verifyJWT, controller.updateCollection)

    return router
}
