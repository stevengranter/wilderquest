// src/routes/collectionRouter.ts
import { Router } from 'express'
import type { CollectionController } from '../controllers/collectionController.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function collectionRouter(controller: CollectionController) {
    const router = Router()


    // Public: Get all public collections (globally)
    router.get('/', controller.getAllPublicCollections)

    // Authenticated: Get collections owned by the authenticated user (public or private)
    router.get('/mine', verifyJWT, controller.getCollectionsByUserId)

    // NEW: Public: Get public collections by a specific user ID
    // This can be public as it only exposes public collections anyway
    router.get('/user/:user_id/public', controller.getCollectionsByUserId) // No auth needed, it's public info
    // Public: Get a single collection by ID (if it's public or user owns it)
    router.get('/:id', optionalAuthMiddleware, controller.getCollectionById)

    router.post('/', verifyJWT, controller.createCollection)
    router.put('/:id', verifyJWT, controller.updateCollection)
    router.patch('/:id', verifyJWT, controller.updateCollection)

    return router
}

