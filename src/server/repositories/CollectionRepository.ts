import BaseRepository from './BaseRepository.js'
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { type Collection } from '../models/Collection.js'
import { type CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'

// Instantiate a InstanceType for TypeScript completions
type CollectionRepositoryConstructor = typeof CollectionRepository;
export type CollectionRepositoryInstance = InstanceType<CollectionRepositoryConstructor>;

export default class CollectionRepository extends BaseRepository<Collection> {
    constructor(tableName: string, dbPool: Pool) {
        super(tableName, dbPool)
        console.log(
            `CollectionsRepository constructed for table '${tableName}' with dbPool:`,
            dbPool ? 'exists' : 'does not exist',
        )
    }

    async create(data: Partial<Collection>): Promise<number> {
        const created_at: Date = new Date()
        const updated_at: Date = new Date()
        const parsed = CollectionSchema.parse(data)
        const newData = { ...parsed, created_at, updated_at }
        return await super.create(newData)
    }

    async getAllPublicCollections(): Promise<Collection[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT *
            FROM ${this.getTableName()}
            WHERE is_private = 0
            `,
            )
            console.log('rows: ', rows)
            return rows as Collection[]
        } catch (err) {
            console.log(err)
            throw err
        }
    }

    async getCollectionsByUserId(user_id: number): Promise<Collection[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT *
                 FROM ${this.getTableName()}
                 WHERE user_id = ?`,
                [user_id]
            );
            console.log('rows', rows)
            return rows as Collection[]
        } catch (error) {
            console.error('Error fetching collections by user_id:', error)
            throw error
        }
    }

    async getTaxaByCollectionId(collection_id: number): Promise<CollectionToTaxa[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`,
                [collection_id]
            );
            console.log('rows', rows)
            return rows as CollectionToTaxa[]
        } catch (error) {
            console.error('Error fetching taxa by collection_id:', error)
            throw error
        }
    }

    async updateCollection(
        collectionId: number,
        name: string,
        description: string
    ): Promise<{ success: boolean }> {
        // TODO: verify collection exists
        const updated_at = new Date()
        const [result] = await this.getDb().execute<ResultSetHeader>(
            'UPDATE collections SET name = ?, description = ?, updated_at = ? WHERE id = ?',
            [name, description, updated_at, collectionId],
        );

        if (result.affectedRows === 0) {
            throw Error
        }
        return { success: true }
    }

    async updateCollectionTaxa(
        collectionId: number,
        taxaIds: number[]
    ): Promise<{ success: boolean }> {
        try {
            if (taxaIds && taxaIds.length > 0) {
                for (let i = 0; i < taxaIds.length; i++) {
                    await this.getDb().execute(
                        'INSERT INTO collections_to_taxa (collection_id, taxon_id) VALUES (?,?)',
                        [collectionId, taxaIds[i]]
                    );
                }
            }
            return { success: true }
        } catch (error) {
            console.error('Error updating collection taxa:', error)
            throw error
        }
    }
}

