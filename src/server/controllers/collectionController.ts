import { Request, Response } from 'express'
import { CollectionRepositoryInstance } from '../repositories/CollectionRepository.js'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'

export interface CollectionController {
    getAllPublicCollections: (req: Request, res: Response) => Promise<void>
    getCollectionById: (req: Request, res: Response) => Promise<void>
    getCollectionsByUserId: (req: Request, res: Response) => Promise<void>
    createCollection: (req: AuthenticatedRequest, res: Response) => Promise<void>
    updateCollection: (req: AuthenticatedRequest, res: Response) => Promise<void>
}

export function createCollectionController(collectionRepo: CollectionRepositoryInstance) {
    return {
        async getAllPublicCollections(req: Request, res: Response): Promise<void> {
            try {
                const allCollections = await collectionRepo.getAllPublicCollections()
                res.json(allCollections)
            } catch (err: unknown) {
                if (err instanceof Error) {
                    res.status(400).send(err.message)
                } else {
                    res.status(500).send({ message: 'Internal error' })
                }

            }
        },

        async getCollectionById(req: Request, res: Response) {
            try {
                const collection = await collectionRepo.findOne({ id: Number(req.params.id), is_private: false })
                res.json(collection)
            } catch (_error) {
                res.status(404).json({ error: 'No collection found' })
            }
        },

        async getCollectionsByUserId(req: Request, res: Response) {
            try {
                const user_id = Number(req.params.user_id)
                const collections = await collectionRepo.getCollectionsByUserId(user_id)
                res.json(collections)
            } catch (_error) {
                res.status(500).json({ error: 'Failed to fetch collections by user ID' })
            }
        },

        async createCollection(req: AuthenticatedRequest, res: Response) {
            try {
                if (!req.user) {
                    res.status(400).json({ message: 'Authentication failed' })
                    return
                }
                const { id: user_id } = req.user
                const parsedBody = CollectionSchema.safeParse(req.body)
                if (parsedBody.error) {
                    res.status(400).send(parsedBody.error.message)
                    return
                }
                const collectionData = { ...parsedBody.data, user_id }
                const result = await collectionRepo.create(collectionData)
                if (result > 0) {
                    res.status(200).json({
                        message: 'Collection created successfully!',
                    })
                }
            } catch (_error) {
                res.status(500).json({ error: 'Internal server error' })
            }
        },

        async updateCollection(req: AuthenticatedRequest, res: Response) {
            try {
                const id = Number(req.params.id)
                if (!req.user || !req.user.id) {
                    res.status(400).send({ message: 'Authentication failed' })
                    return
                }
                const { id: user_id } = req.user
                const { name, description, taxa } = req.body

                try {
                    // const userCollections = await collectionRepo.getCollectionsByUserId(user_id)
                    const collection = await collectionRepo.findOne({ user_id, id })
                    // console.log(userCollections)
                    // res.status(200).json(userCollections)
                    if (!collection) {
                        res.status(404).json({
                            message: `Cannot update collection. Collection not found, or not owned by user`,
                        })
                        return
                    }
                    const detailsResult = await collectionRepo.updateCollection(id, name, description)

                    if (taxa) {
                        await collectionRepo.updateCollectionTaxa(id, taxa)
                    }

                    res.json({ message: 'Collection updated successfully' })
                    return
                } catch (error) {
                    console.error('Error updating collection:', error)
                    res.status(500).json({ error: 'Internal server error' })
                }
            } catch (_error) {
                res.status(500).json({ error: 'Internal server error' })
            }
        },
    }
}
