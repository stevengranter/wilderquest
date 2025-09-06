import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthenticatedRequest } from '../middlewares/index.js'
import { type CollectionRepository } from '../repositories/index.js'
import { createCollectionService } from '../services/index.js'
import {
    Collection,
    CollectionSchema,
    CreateCollectionSchema,
} from '../models/index.js'
import { serverDebug } from '../../shared/utils/debug.js'

export function createCollectionController(
    collectionRepo: CollectionRepository
) {
    return {
        async getAllPublicCollections(
            req: Request,
            res: Response
        ): Promise<void> {
            try {
                const service = createCollectionService(collectionRepo, null)
                const allCollections = await service.getAllPublicCollections()
                res.json(allCollections)
            } catch (err: unknown) {
                res.status(500).json({
                    message: 'Internal server error',
                    error: (err as Error).message,
                })
            }
        },

        async getCollectionById(req: Request, res: Response): Promise<void> {
            try {
                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const userId = (req as AuthenticatedRequest).user?.id ?? null
                const service = createCollectionService(collectionRepo, userId)

                // First try to get the collection directly from the repository
                const collection = await collectionRepo.findOne({
                    id: collectionId,
                })

                if (!collection) {
                    res.status(404).json({ message: 'Collections not found' })
                    return
                }

                // If collection is private, check authorization
                if (collection.is_private) {
                    if (!userId || collection.user_id !== userId) {
                        res.status(403).json({
                            message: 'Access to private collection denied',
                        })
                        return
                    }
                }
                if (
                    collection.id === undefined ||
                    collection.user_id === undefined
                ) {
                    res.status(500).json({
                        message: 'Collections is missing required fields',
                    })
                    return
                }

                // Before calling enrichCollectionWithTaxa, check required fields
                if (
                    typeof collection.id !== 'number' ||
                    typeof collection.user_id !== 'number'
                ) {
                    res.status(500).json({
                        message: 'Collections is missing required fields',
                    })
                    return
                }

                const enrichedCollection =
                    await service.enrichCollectionWithTaxa(
                        collection as Collection
                    )
                res.json(enrichedCollection)
            } catch (error) {
                res.status(500).json({
                    message: 'Failed to fetch collection by ID',
                    error: (error as Error).message,
                })
            }
        },

        async getPublicCollectionsByUserId(
            req: AuthenticatedRequest,
            res: Response
        ): Promise<void> {
            try {
                const userId = Number(req.params.user_id)

                if (isNaN(userId)) {
                    res.status(400).json({ message: 'Invalid user ID' })
                    return
                }

                const service = createCollectionService(collectionRepo, userId)
                const collections =
                    await service.findCollectionsByUserId(userId)
                serverDebug.db(
                    'Retrieved collections for user %s: %o',
                    userId,
                    collections
                )
                res.json(collections)
            } catch (error: unknown) {
                res.status(500).json({
                    message: 'Failed to fetch collections by user ID',
                    error: (error as Error).message,
                })
            }
        },

        async createCollection(
            req: AuthenticatedRequest,
            res: Response
        ): Promise<void> {
            try {
                const userId = req.user?.id
                serverDebug.db('Creating collection for user: %s', userId)
                serverDebug.db('Request body: %o', req.body)

                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized' })
                    return
                }

                const parsedBody = CreateCollectionSchema.safeParse({
                    ...req.body,
                    user_id: userId,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                if (!parsedBody.success) {
                    res.status(400).send(parsedBody.error.issues)
                    return
                }

                serverDebug.db('Parsed collection data: %o', parsedBody.data)

                const service = createCollectionService(collectionRepo, userId)
                const newCollection = await service.createCollection(
                    parsedBody.data
                )

                res.status(201).json({
                    message: 'Collections created successfully!',
                    collection: newCollection,
                })
            } catch (error: unknown) {
                res.status(500).json({
                    message: 'Internal server error',
                    error: (error as Error).message,
                })
            }
        },

        async updateCollection(
            req: AuthenticatedRequest,
            res: Response
        ): Promise<void> {
            try {
                serverDebug.db(
                    'Updating collection - request body: %o',
                    req.body
                )
                serverDebug.db('User: %o', req.user)
                const userId = req.user?.id
                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized' })
                    return
                }

                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const parsedBody = CollectionSchema.partial().safeParse(
                    req.body
                )
                if (!parsedBody.success) {
                    res.status(400).send(parsedBody.error.issues)
                    return
                }
                serverDebug.db('Parsed update data: %o', parsedBody.data)
                const service = createCollectionService(collectionRepo, userId)
                const updatedCollection = await service.updateCollection(
                    collectionId,
                    parsedBody.data
                )

                if (updatedCollection) {
                    res.status(200).json({
                        message: 'Collections updated successfully!',
                        collection: updatedCollection,
                    })
                } else {
                    res.status(404).json({
                        message:
                            'Collections not found or unauthorized to update',
                    })
                }
            } catch (error: unknown) {
                res.status(500).json({
                    message: 'Internal server error',
                    error: (error as Error).message,
                })
            }
        },

        async deleteCollection(
            req: AuthenticatedRequest,
            res: Response
        ): Promise<void> {
            try {
                const userId = req.user?.id
                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized' })
                    return
                }

                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const service = createCollectionService(collectionRepo, userId)
                const success = await service.deleteCollection(collectionId)

                if (success) {
                    res.status(204).send()
                } else {
                    res.status(404).json({
                        message:
                            'Collections not found or unauthorized to delete',
                    })
                }
            } catch (error: unknown) {
                res.status(500).json({
                    message: 'Internal server error',
                    error: (error as Error).message,
                })
            }
        },
        async updateCollectionTaxa(
            req: AuthenticatedRequest,
            res: Response
        ): Promise<void> {
            try {
                const userId = req.user?.id
                if (!userId) {
                    res.status(401).json({ message: 'Unauthorized' })
                    return
                }

                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const taxaSchema = z.array(z.number())
                const parsedBody = taxaSchema.safeParse(req.body.taxon_ids)
                if (!parsedBody.success) {
                    res.status(400).send(parsedBody.error.issues)
                    return
                }

                const service = createCollectionService(collectionRepo, userId)
                const updatedCollection = await service.updateCollectionTaxa(
                    collectionId,
                    parsedBody.data
                )

                if (updatedCollection) {
                    res.status(200).json({
                        message: 'Collections taxa updated successfully!',
                        collection: updatedCollection,
                    })
                } else {
                    res.status(404).json({
                        message:
                            'Collections not found or unauthorized to update',
                    })
                }
            } catch (error: unknown) {
                res.status(500).json({
                    message: 'Internal server error',
                    error: (error as Error).message,
                })
            }
        },
    }
}

export type CollectionController = ReturnType<typeof createCollectionController>
