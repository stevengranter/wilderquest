// users.controller.ts
import {Request, Response} from 'express'

import UsersRepository from '../repositories/UsersRepository.js'
import CollectionsRepository from '../repositories/CollectionsRepository.js'
import {AuthenticatedRequest} from '../middleware/verifyJWT.js'

const getAll = async (req: AuthenticatedRequest, res: Response) => {
    // res.status(200).send(req.user);
    if (!req.user) {
        res.status(401).send({message: 'No user in request'})
        return
    }

    const {role_id} = req.user
    console.log(req.user)
    // res.status(200).send(role_id);
    if (role_id !== 2) {
        res.status(401).send({message: 'Not Authorized'})
        return
    }

    const result = await UsersRepository.getColumns(
        ['id', 'user_cuid', 'username', 'email'],
        {orderByColumn: 'id', order: 'desc'}
    )

    if (result) {
        res.status(200).json(result)
        return
    } else {
        res.status(404).json({message: 'Not Found'})
        return
    }
}

const getById = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    console.log(req.params)
    const result = await UsersRepository.findOne({id})
    // const collections = await CollectionsRepository.getCollectionsByUserId(id)
    if (result) {
        res.status(200).json({
            username: result.username,
            user_cuid: result.user_cuid,
        })
        return
    } else {
        res.status(404).json({message: 'Not Found'})
        return
    }
}

const getByRequestUser = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        res.status(400).json({message: 'Authentication required'})
    }
    const id = req.user?.id
    const result = await UsersRepository.findOne({id})
    console.log(result)
    if (result) {
        res.status(200).json({username: result.username})
        return
    } else {
        res.status(404).json({message: 'Not Found'})
        return
    }
}

const getCollectionsByUserId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const result = await CollectionsRepository.getCollectionsByUserId(id)
    if (result) {
        let enrichedResult = []
        for (const collection of result) {
            if (collection.id) {
                const enrichedCollection = {
                    ...collection,
                    taxon_ids: [] as number[],
                }
                const taxa = await CollectionsRepository.getTaxaByCollectionId(
                    collection.id
                )
                taxa.forEach((item) =>
                    enrichedCollection.taxon_ids.push(item.taxon_id)
                )
                enrichedResult.push(enrichedCollection)
            }
        }
        // res.status(200).json(enrichedResult)
        res.status(200).json(enrichedResult)
        return
    } else {
        res.status(404).json({message: 'Not Found'})
        return
    }
}

const usersController = {
    getAll,
    getById,
    getByRequestBodyId: getByRequestUser,
    getCollectionsByUserId,
}

export default usersController
