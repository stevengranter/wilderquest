import BaseRepository from './BaseRepository.js';
import {Collection} from "../../types.js";
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


}

export default new CollectionsRepository(); // Export a single instance
