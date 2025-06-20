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

    async findByUserId(userId: number): Promise<Collection[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT *
                 FROM ${this.getTableName()}
                 WHERE user_id = ?`,
                [userId],
            );
            console.log('rows', rows)
            return rows as Collection[]
        } catch (error) {
            console.error('Error fetching collections by userId:', error)
            throw error
        }
    }

    async findAllPublic(): Promise<Collection[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT *
                 FROM ${this.getTableName()}
                 WHERE is_private = 0`,
            )
            console.log('rows', rows)
            return rows as Collection[]
        } catch (error) {
            console.error('Error fetching public collections: ', error)
            // Crucial change: Return an empty array on error
            return []
        }
    }

    async findTaxaByCollectionId(collectionId: number): Promise<CollectionToTaxa[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`,
                [collectionId],
            )
            console.log('rows', rows)
            return rows as CollectionToTaxa[]
        } catch (error) {
            console.error('Error fetching taxa by collection_id:', error)
            throw error
        }
    }

    async findPublicCollectionsByUserId(userId: number): Promise<Collection[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT *
                 FROM ${this.getTableName()}
                 WHERE user_id = ? AND is_private = 0`,
                [userId],
            )
            return rows as Collection[]
        } catch (error) {
            console.error('Error fetching collections by userId:', error)
            throw error
        }
    }

    async findCollectionItemsById(collectionId: number): Promise<CollectionToTaxa[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`,
                [collectionId],
            );
            console.log('rows', rows)
            return rows as CollectionToTaxa[]
        } catch (error) {
            console.error('Error fetching taxa by collection_id:', error)
            throw error
        }
    }

    async updateCollectionItems(
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

