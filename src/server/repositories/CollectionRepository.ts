import { Pool, RowDataPacket } from 'mysql2/promise'
import { Collection } from '../models/Collection.js'
import { CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { createBaseRepository } from './BaseRepository.js'

export type CollectionRepository = ReturnType<typeof createCollectionRepository>

export function createCollectionRepository(tableName: string, dbPool: Pool) {
    const base = createBaseRepository<Collection>(tableName, dbPool)

    async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        try {
            const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params)
            return rows as T[]
        } catch (error) {
            console.error(`[CollectionRepository] SQL Error`, {
                sql,
                params,
                error,
            })
            throw error
        }
    }

    async function findByUserId(userId: number): Promise<Collection[]> {
        return query<Collection>(
            `SELECT * FROM ${tableName} WHERE user_id = ?`,
            [userId]
        )
    }

    async function findAllPublic(): Promise<Collection[]> {
        try {
            return await query<Collection>(
                `SELECT * FROM ${tableName} WHERE is_private = 0`
            )
        } catch {
            return [] // silent fallback
        }
    }

    async function findPublicCollectionsByUserId(
        userId: number
    ): Promise<Collection[]> {
        return query<Collection>(
            `SELECT * FROM ${tableName} WHERE user_id = ? AND is_private = 0`,
            [userId]
        )
    }

    async function findTaxaByCollectionId(
        collectionId: number
    ): Promise<CollectionToTaxa[]> {
        return query<CollectionToTaxa>(
            `SELECT taxon_id FROM collections_to_taxa WHERE collection_id = ?`,
            [collectionId]
        )
    }

    const findCollectionItemsById = findTaxaByCollectionId

    async function updateCollectionItems(
        collectionId: number,
        taxaIds: number[]
    ): Promise<{ success: boolean }> {
        if (!taxaIds?.length) return { success: true }

        const connection = await dbPool.getConnection()

        try {
            await connection.beginTransaction()

            // Delete existing entries
            await connection.execute(
                'DELETE FROM collections_to_taxa WHERE collection_id = ?',
                [collectionId]
            )

            // Insert new entries
            const values = taxaIds.map((taxonId) => [collectionId, taxonId])
            const placeholders = values.map(() => '(?, ?)').join(', ')
            const flatValues = values.flat()

            await connection.execute(
                `INSERT INTO collections_to_taxa (collection_id, taxon_id) VALUES ${placeholders}`,
                flatValues
            )

            await connection.commit()
            return { success: true }
        } catch (error) {
            await connection.rollback()
            console.error('Error updating collection taxa:', error)
            throw error
        } finally {
            connection.release()
        }
    }

    return {
        ...base,
        findByUserId,
        findAllPublic,
        findPublicCollectionsByUserId,
        findTaxaByCollectionId,
        findCollectionItemsById,
        updateCollectionItems,
    }
}
