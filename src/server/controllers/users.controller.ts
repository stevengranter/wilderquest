// users.controller.ts
import {Request, Response} from "express";

import UsersRepository from "../repositories/UsersRepository.js";
import CollectionsRepository from "../repositories/CollectionsRepository.js";

const getAll = async (req: Request, res: Response) => {
    const result = await UsersRepository.getColumns(["id","user_cuid","username","email"],{orderByColumn:"created_at", order:"desc"});

    if (result) {
        res.status(200).json(result)
        return
    } else {
        res.status(404).json({message: "Not Found"})
        return
    }
}

const getById = async (req: Request, res: Response) => {
    const id  = parseInt(req.params.id);
    console.log(req.params);
    const result = await UsersRepository.findOne({id})
    if (result) {
        res.status(200).json({username:result.username, user_cuid:result.user_cuid})
        return
    } else {
        res.status(404).json({message: "Not Found"})
        return
    }
}


const getByRequestBodyId = async (req: Request, res: Response) => {
    const id = parseInt(req.body.user_id);
    const result = await UsersRepository.findOne({id})
    console.log(result)
    if (result) {
        res.status(200).json({username: result.username})
        return
    } else {
        res.status(404).json({message: "Not Found"})
        return
    }
}

const getCollectionsByUserId = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await CollectionsRepository.getCollectionsByUserId(id)
    if (result) {
        let enrichedResult = []
        for (const collection of result) {
            if (collection.id) {
                const enrichedCollection = { ...collection, taxon_ids: [] as number[] }
                const taxa = await CollectionsRepository.getTaxaByCollectionId(collection.id)
                taxa.forEach(item => enrichedCollection.taxon_ids.push(item.taxon_id))
                enrichedResult.push(enrichedCollection)
            }
        }
        // res.status(200).json(enrichedResult)
        res.sendStatus(200)
        return
    } else {
        res.status(404).json({message: "Not Found"})
        return
    }
}

const usersController = { getAll, getById, getByRequestBodyId, getCollectionsByUserId };

export default usersController;
