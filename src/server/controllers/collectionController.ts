import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { CollectionRepositoryInstance } from '../repositories/CollectionRepository.js'
import {
    CollectionSchema,
    CreateCollectionSchema,
} from '../schemas/collection.schemas.js'
import { CollectionService } from '../services/CollectionService.js'

export function createCollectionController(
    collectionRepo: CollectionRepositoryInstance
) {
    return {
        async getAllPublicCollections(
            req: Request,
            res: Response
        ): Promise<void> {
            try {
                const service = new CollectionService(collectionRepo, null)
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
                const service = new CollectionService(collectionRepo, userId)

                // First try to get the collection directly from the repository
                const collection = await collectionRepo.findOne({
                    id: collectionId,
                })

                if (!collection) {
                    res.status(404).json({ message: 'Collection not found' })
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

                // If we get here, either the collection is public or the user is authorized
                const enrichedCollection =
                    await service.enrichCollectionWithTaxa(collection)
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

                const service = new CollectionService(collectionRepo, userId)
                const collections =
                    await service.findCollectionsByUserId(userId)
                console.log(collections)
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
                console.log('userId: ', userId)
                console.log('req.body: ', req.body)

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

                const service = new CollectionService(collectionRepo, userId)
                const newCollection = await service.createCollection(
                    parsedBody.data
                )

                res.status(201).json({
                    message: 'Collection created successfully!',
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
                console.log(
                    'from controller.updateCollection -- req.body: ',
                    req.body
                )
                console.log('req.user: ', req.user)
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
                console.log('parsedBody.data: ', parsedBody.data)
                const service = new CollectionService(collectionRepo, userId)
                const updatedCollection = await service.updateCollection(
                    collectionId,
                    parsedBody.data
                )

                if (updatedCollection) {
                    res.status(200).json({
                        message: 'Collection updated successfully!',
                        collection: updatedCollection,
                    })
                } else {
                    res.status(404).json({
                        message:
                            'Collection not found or unauthorized to update',
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

                const service = new CollectionService(collectionRepo, userId)
                const success = await service.deleteCollection(collectionId)

                if (success) {
                    res.status(204).send()
                } else {
                    res.status(404).json({
                        message:
                            'Collection not found or unauthorized to delete',
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

                const service = new CollectionService(collectionRepo, userId)
                const updatedCollection = await service.updateCollectionTaxa(
                    collectionId,
                    parsedBody.data
                )

                if (updatedCollection) {
                    res.status(200).json({
                        message: 'Collection taxa updated successfully!',
                        collection: updatedCollection,
                    })
                } else {
                    res.status(404).json({
                        message:
                            'Collection not found or unauthorized to update',
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
