import {Request, Response} from "express"
import {collectionSchema} from "../schemas/collection.schema.js";
import CollectionsRepository from "../repositories/CollectionsRepository.js";

const getAll = async (req: Request, res: Response) => {
    const result = await CollectionsRepository.getAll();
    console.log(result);
    res.status(200).json(result);
    return
}

const getById = async (req: Request, res: Response) => {
    const id = req.params.id;
    console.log(req.params);
    const collection = await CollectionsRepository.findOne({id});
    if (collection) {
        const enrichedCollection = { ...collection, taxon_ids: [] as number[] }
            if (collection.id) {
                const taxa = await CollectionsRepository.getTaxaByCollectionId(collection.id)
                taxa.forEach(item => enrichedCollection.taxon_ids.push(item.taxon_id))
            }
        res.status(200).json(enrichedCollection)
        return
    } else {
        res.status(404).json({message: "Not Found"})
        return
    }
}

const create = async(req:Request, res: Response) => {
    const parsedBody = collectionSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }


    const result = await CollectionsRepository.create(parsedBody.data)


    if (result > 0) {
        res.status(200).json({
            message: "Collection created successfully!"});
        return
    } else {
        res.status(500).json({ message: "Failed to create collection" });
        return
    }

}

const update = async(req:Request, res: Response) => {
    const parsedBody = collectionSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }
    const {id,user_id,name:requestedName} = parsedBody.data


    const foundCollection = await CollectionsRepository.findOne({id, user_id})

    // res.status(200).json({"message": `Found collection: ${foundCollection?.name}`})
    console.log("foundCollection", foundCollection)

    if (foundCollection && foundCollection.name && foundCollection.id) {
        console.log("Found collection:", foundCollection.name)

        // const result = await db.execute("".)
        const result = await CollectionsRepository.update(foundCollection.id,{name: requestedName})

        console.log(result)
        if (result) {
            res.status(200).json({
                message: "Collection updated successfully!"});
            return
        } else {
            res.status(500).json({ message: "Failed to update collection" });
            return
        }

    } else {
        res.status(400).json({ message: "Could not update collection" });
        return
    }

}





const collectionsController = {
    create,update,getById,getAll
}

export default collectionsController
