import { Pool, RowDataPacket } from 'mysql2/promise'
import { createBaseRepository } from './BaseRepository.js'

type Quest = {
    id: number
    name: string
    created_at: Date
    updated_at: Date
    description?: string
    is_private: boolean
    user_id: number
}

export type QuestRepository = ReturnType<typeof createQuestRepository>

export function createQuestRepository(tableName: string, dbPool: Pool) {
    const base = createBaseRepository<Quest>(tableName, dbPool)

    async function findAccessibleById(
        id: number,
        userId?: number
    ): Promise<Quest | null> {
        const query = `
      SELECT * FROM ${base.getTableName()}
      WHERE id = ?
        AND (is_private = FALSE OR user_id = ?)
      LIMIT 1
    `
        const [rows] = await base
            .getDb()
            .execute<RowDataPacket[]>(query, [id, userId ?? -1])
        return rows.length > 0 ? (rows[0] as Quest) : null
    }

    async function findAccessibleByUserId(userId: number): Promise<Quest[]> {
        const query = `
      SELECT * FROM ${base.getTableName()}
      WHERE user_id = ?
        AND (is_private = FALSE OR user_id = ?)
    `
        const [rows] = await base
            .getDb()
            .execute<RowDataPacket[]>(query, [userId, userId])
        return rows as Quest[]
    }

    async function saveQuest(quest: Partial<Quest>): Promise<number> {
        const now = new Date()
        return base.create({
            ...quest,
            created_at: now,
            updated_at: now,
        })
    }

    return {
        ...base,
        findAccessibleById,
        findAccessibleByUserId,
        saveQuest,
    }
}

type QuestToTaxa = {
    id: number
    quest_id: number
    taxon_id: number
}

export type QuestToTaxaRepository = ReturnType<
    typeof createQuestToTaxaRepository
>

export function createQuestToTaxaRepository(tableName: string, dbPool: Pool) {
    return createBaseRepository<QuestToTaxa>(tableName, dbPool)
}
