import { Pool, RowDataPacket } from 'mysql2/promise'
import { type Collection } from '../models/Collection.js'
import { type CollectionToTaxa } from '../models/CollectionToTaxa.js'
import BaseRepository from './BaseRepository.js'

// Type export for usage elsewhere
export type CollectionRepositoryInstance = InstanceType<
    typeof CollectionRepository
>

export default class CollectionRepository extends BaseRepository<Collection> {
    constructor(tableName: string, dbPool: Pool) {
        super(tableName, dbPool)
        console.log(
            `[CollectionRepository] Initialized for table '${tableName}'`,
        )
    }

    private async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>(
                sql,
                params,
            )
            return rows as T[]
        } catch (error) {
            console.error(`[CollectionRepository] SQL Error:`, {
                sql,
                params,
                error,
            })
            throw error
        }
    }

    async findByUserId(userId: number): Promise<Collection[]> {
        return this.query<Collection>(
            `SELECT * FROM ${this.getTableName()} WHERE user_id = ?`,
            [userId],
        )
    }

    async findAllPublic(): Promise<Collection[]> {
        try {
            return await this.query<Collection>(
                `SELECT * FROM ${this.getTableName()} WHERE is_private = 0`,
            )
        } catch (error) {
            return [] // Silent failure fallback
        }
    }

    async findPublicCollectionsByUserId(userId: number): Promise<Collection[]> {
        return this.query<Collection>(
            `SELECT * FROM ${this.getTableName()} WHERE user_id = ? AND is_private = 0`,
            [userId],
        )
    }

    async findTaxaByCollectionId(
        collectionId: number,
    ): Promise<CollectionToTaxa[]> {
        return this.query<CollectionToTaxa>(
            `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`,
            [collectionId],
        )
    }

    // Alias for findTaxaByCollectionId
    async findCollectionItemsById(
        collectionId: number,
    ): Promise<CollectionToTaxa[]> {
        return this.findTaxaByCollectionId(collectionId)
    }

    async updateCollectionItems(
        collectionId: number,
        taxaIds: number[]
    ): Promise<{ success: boolean }> {
        if (!taxaIds?.length) return { success: true }

        const values = taxaIds.map((taxonId) => [collectionId, taxonId])
        const placeholders = values.map(() => '(?, ?)').join(', ')

        try {
            await this.getDb().execute(
                `INSERT INTO collections_to_taxa (collection_id, taxon_id)
                VALUES
                ${placeholders}`,
                values.flat(),
            )
            return { success: true }
        } catch (error) {
            console.error('Error bulk inserting collection taxa:', error)
            throw error
        }
    }
}
