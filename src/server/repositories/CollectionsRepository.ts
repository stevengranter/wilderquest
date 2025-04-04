import BaseRepository from './BaseRepository.js';
import {Collection, CollectionToTaxaSchema} from "../../types.js";
import db from "../db.js";
import {RowDataPacket} from "mysql2/promise";


class CollectionsRepository extends BaseRepository<Collection> {

    constructor() {
        super('collections');
    }

    async create(data: Partial<Collection>): Promise<number> {
        const created_at: Date = new Date();
        const updated_at: Date = new Date();
        const newData = {...data, created_at, updated_at};
        return await super.create(newData);
    }

    async getCollectionsByUserId(user_id: number): Promise<Collection[]> {
        try {
            const [rows] = await db.execute<RowDataPacket[]>(
                `SELECT * FROM collections WHERE user_id = ?`, [user_id]);
            console.log("rows", rows);
            return rows as Collection[];
        } catch (error) {
            console.error('Error fetching collections by user_id:', error);
            throw error;
        }
    }

    async getTaxaByCollectionId(collection_id: number): Promise<CollectionToTaxaSchema[]> {
        try {
            const [rows] = await db.execute<RowDataPacket[]>(
                `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`, [collection_id]);
            console.log("rows", rows);
            return rows as CollectionToTaxaSchema[];
        }catch (error) {
            console.error('Error fetching taxa by collection_id:', error);
            throw error;
        }
    }


}

export default new CollectionsRepository(); // Export a single instance
