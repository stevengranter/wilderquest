import {Request, Response} from 'express'
import { AuthenticatedRequest } from '../_middleware/verifyJWT.js'
import { collectionSchema } from '../_schemas/collection.schema.js'
import CollectionsRepository from '../4_repositories/CollectionsRepository.js'
import { collectionToTaxaSchema } from '../_schemas/collection_to_taxa.schema.js'

const getAll = async (req: Request, res: Response) => {
    const result = await CollectionsRepository.getAll()
    console.log(result)
    res.status(200).json(result)
    return
}

const getById = async (req: Request, res: Response) => {
    const id = req.params.id
    console.log(req.params)
    const collection = await CollectionsRepository.findOne({id})
    if (collection) {
        const enrichedCollection = { ...collection, taxon_ids: [] as number[] }
        if (collection.id) {
            const taxa = await CollectionsRepository.getTaxaByCollectionId(
                collection.id
            )
            taxa.forEach((item) =>
                enrichedCollection.taxon_ids.push(item.taxon_id)
            )
        }
        res.status(200).json(enrichedCollection)
        return
    } else {
        res.status(404).json({message: 'Not Found'})
        return
    }
}

const create = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        res.status(400).json({message: 'Authentication failed'})
        return
    }
    const {id: user_id} = req.user

    const parsedBody = collectionSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }
    const collectionData = {...parsedBody.data, user_id}

    const result = await CollectionsRepository.create(collectionData)

    if (result > 0) {
        res.status(200).json({
            message: 'Collection created successfully!',
        })
        return
    } else {
        res.status(500).json({message: 'Failed to create collection'})
        return
    }
}

const updateCollection = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const {id} = req.params
    if (!req.user || !req.user.id) {
        res.status(400).send({message: 'Authentication failed'})
        return
    }
    const {id: user_id} = req.user
    const {name, description, taxa} = req.body

    try {
        // const userCollections = await CollectionsRepository.getCollectionsByUserId(user_id)
        const collection = await CollectionsRepository.findOne({user_id, id})
        // console.log(userCollections)
        // res.status(200).json(userCollections)
        if (!collection) {
            res.status(404).json({
                message: `Cannot update collection. Collection not found, or not owned by user`,
            })
            return
        }
        const detailsResult = await CollectionsRepository.updateCollection(
            parseInt(id),
            name,
            description
        )

        if (taxa) {
            await CollectionsRepository.updateCollectionTaxa(parseInt(id), taxa)
        }

        res.json({message: 'Collection updated successfully'})
        return
    } catch (error) {
        console.error('Error updating collection:', error)
        res.status(500).json({error: 'Internal server error'})
    }
}

const collectionsController = {
    create,
    updateCollection,
    getById,
    getAll,
}

export default collectionsController
