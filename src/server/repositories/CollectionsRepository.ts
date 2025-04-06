import BaseRepository from './BaseRepository.js';
import {Collection, CollectionToTaxaSchema} from "../../types/types.js";
import db from "../db.js";
import {ResultSetHeader, RowDataPacket} from "mysql2/promise";


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

    async updateCollection(collectionId: number, name: string, description: string): Promise<{success:boolean}> {
        // TODO: verify collection exists
        const [result] = await db.execute<ResultSetHeader>('UPDATE collections SET name = ?, description = ? WHERE id = ?', [name, description, collectionId]) ;
        if (result.affectedRows === 0) {
            throw Error
        }
        return {success:true};
    }

    async updateCollectionTaxa(collectionId: number, taxaIds: number[]): Promise<{ success: boolean }> {
        try {

            if (taxaIds && taxaIds.length > 0) {
                for (let i = 0; i < taxaIds.length; i++) {
                    await db.execute('INSERT INTO collections_to_taxa (collection_id, taxon_id) VALUES (?,?)', [collectionId, taxaIds[i]]);
                }

            }
            return { success: true };
        } catch (error) {
            console.error('Error updating collection taxa:', error);
            throw error;
        }
    }

}

export default new CollectionsRepository(); // Export a single instance
