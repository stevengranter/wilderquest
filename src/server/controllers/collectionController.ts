import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'
import { CollectionServiceInstance } from '../services/CollectionService.js'

export function createCollectionController(collectionService: CollectionServiceInstance) {
    return {
        async getAllPublicCollections(req: Request, res: Response): Promise<void> {
            try {
                // Delegate to the service to fetch public collections
                const allCollections = await collectionService.getAllPublicCollections()
                res.json(allCollections)
            } catch (err: unknown) {
                if (err instanceof Error) {
                    // Send a 400 for client-side errors, 500 for unexpected server errors
                    res.status(400).send(err.message)
                } else {
                    res.status(500).send({ message: 'Internal server error' })
                }
            }
        },

        async getCollectionById(req: Request, res: Response): Promise<void> {
            try {
                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }
                // Delegate to the service to find a public collection by ID
                const collection = await collectionService.getPublicCollectionById(collectionId)
                if (collection) {
                    res.json(collection)
                } else {
                    res.status(404).json({ message: 'Collection not found or is private' })
                }
            } catch (error) {
                res.status(500).json({ message: 'Failed to fetch collection by ID' })
            }
        },

        async getCollectionsByUserId(req: AuthenticatedRequest, res: Response): Promise<void> {
            console.log(req.user)
            console.log(req.params)
            try {
                if (!req.user || !req.user.id) {
                    res.status(401).json({ message: 'Unauthorized: User not authenticated.' })
                    return
                }
                const targetUserId = Number(req.params.user_id) | req.user.id
                const authenticatedUserId = req.user.id

                if (isNaN(targetUserId)) {
                    res.status(400).json({ message: 'Invalid user ID' })
                    return
                }

                // Delegate to the service to find collections by user ID, with authorization check
                const collections = await collectionService.findCollectionsByUserId(targetUserId, authenticatedUserId)
                res.json(collections)
            } catch (error: unknown) {
                if (error instanceof Error) {
                    res.status(403).json({ message: error.message }) // Use 403 for forbidden access
                } else {
                    res.status(500).json({ message: 'Failed to fetch collections by user ID' })
                }
            }
        },

        async createCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
            try {
                if (!req.user || !req.user.id) {
                    res.status(401).json({ message: 'Unauthorized: User not authenticated.' })
                    return
                }

                const parsedBody = CollectionSchema.safeParse(req.body)
                if (parsedBody.error) {
                    res.status(400).send(parsedBody.error.issues) // Send detailed Zod errors
                    return
                }

                const userId = req.user.id
                const collectionData = parsedBody.data

                // Delegate to the service to handle the creation logic
                const newCollection = await collectionService.createCollection(collectionData, userId)

                res.status(201).json({
                    message: 'Collection created successfully!',
                    collection: newCollection, // Return the created collection data
                })
            } catch (error: unknown) {
                if (error instanceof Error) {
                    res.status(500).json({ message: 'Internal server error', details: error.message })
                } else {
                    res.status(500).json({ message: 'Internal server error' })
                }
            }
        },

        async updateCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
            try {
                if (!req.user || !req.user.id) {
                    res.status(401).json({ message: 'Unauthorized: User not authenticated.' })
                    return
                }

                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const parsedBody = CollectionSchema.partial().safeParse(req.body) // Use partial for updates
                if (parsedBody.error) {
                    res.status(400).send(parsedBody.error.issues)
                    return
                }

                const userId = req.user.id
                const updateData = parsedBody.data

                // Delegate to the service to handle the update logic
                const updatedCollection = await collectionService.updateCollection(collectionId, updateData, userId)

                if (updatedCollection) {
                    res.status(200).json({
                        message: 'Collection updated successfully!',
                        collection: updatedCollection,
                    })
                } else {
                    res.status(404).json({ message: 'Collection not found or unauthorized to update' })
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    res.status(500).json({ message: 'Internal server error', details: error.message })
                } else {
                    res.status(500).json({ message: 'Internal server error' })
                }
            }
        },

        async deleteCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
            try {
                if (!req.user || !req.user.id) {
                    res.status(401).json({ message: 'Unauthorized: User not authenticated.' })
                    return
                }

                const collectionId = Number(req.params.id)
                if (isNaN(collectionId)) {
                    res.status(400).json({ message: 'Invalid collection ID' })
                    return
                }

                const userId = req.user.id

                // Delegate to the service to handle the deletion logic
                const success = await collectionService.deleteCollection(collectionId, userId)

                if (success) {
                    res.status(204).send() // 204 No Content for successful deletion
                } else {
                    res.status(404).json({ message: 'Collection not found or unauthorized to delete' })
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    res.status(500).json({ message: 'Internal server error', details: error.message })
                } else {
                    res.status(500).json({ message: 'Internal server error' })
                }
            }
        },
    }
}

export type CollectionController = ReturnType<typeof createCollectionController>