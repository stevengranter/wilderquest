import { Pool, RowDataPacket } from 'mysql2/promise'
import { createBaseRepository } from './BaseRepository.js'

export type Quest = {
    id: number
    name: string
    created_at: Date
    updated_at: Date
    description?: string
    is_private: boolean
    user_id: number
    username: string
    status: 'pending' | 'active' | 'paused' | 'ended'
    location_name?: string
    latitude?: number
    longitude?: number
}

export type QuestWithTaxa = Quest & {
    taxon_ids: number[]
    photoUrl?: string | null
}

export type QuestRepository = ReturnType<typeof createQuestRepository>

export function createQuestRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof Quest)[],
    questsToTaxaRepo?: ReturnType<typeof createQuestToTaxaRepository>
) {
    const base = createBaseRepository<Quest>(tableName, dbPool, validColumns)

    async function findById(questId: number) {
        const query = `
      SELECT * FROM ${tableName}
      WHERE id = ?
      LIMIT 1
    `
        const [rows] = await base
            .getDb()
            .execute<RowDataPacket[]>(query, [questId])
        return rows.length > 0 ? (rows[0] as Quest) : null
    }

    async function findAccessibleById(
        id: number,
        userId?: number
    ): Promise<QuestWithTaxa | null> {
        const query = `
      SELECT
        q.*,
        u.username,
        GROUP_CONCAT(qt.taxon_id) AS taxon_ids
      FROM ${tableName} q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quests_to_taxa qt ON q.id = qt.quest_id
      WHERE q.id = ?
        AND (q.is_private = FALSE OR q.user_id = ?)
      GROUP BY q.id
      LIMIT 1
    `
        const [rows] = await base
            .getDb()
            .execute<RowDataPacket[]>(query, [id, userId ?? -1])

        if (rows.length === 0) {
            return null
        }

        const row = rows[0]
        const quest: QuestWithTaxa = {
            id: row.id,
            name: row.name,
            created_at: row.created_at,
            updated_at: row.updated_at,
            description: row.description,
            is_private: row.is_private,
            user_id: row.user_id,
            username: row.username,
            status: row.status,
            location_name: row.location_name,
            latitude: row.latitude,
            longitude: row.longitude,
            taxon_ids: row.taxon_ids
                ? row.taxon_ids.split(',').map(Number)
                : [],
        }

        return quest
    }

    async function findAccessibleByUserId(
        userId: number,
        viewerId?: number
    ): Promise<Quest[]> {
        const isOwner = userId === viewerId
        console.log('isOwner', isOwner)
        console.log('userId', userId)

        if (isOwner) {
            // return all quests (public and private)
            const [rows] = await dbPool.query(
                `SELECT * FROM quests WHERE user_id = ?`,
                [userId]
            )
            return rows as Quest[]
        } else {
            // only return public quests
            console.log('getting public quests')
            const [rows] = await dbPool.query(
                `SELECT * FROM quests WHERE user_id = ? AND is_private = false`,
                [userId]
            )
            return rows as Quest[]
        }
    }

    async function findTaxaForQuest(questId: number) {
        if (!questsToTaxaRepo) {
            throw new Error('questsToTaxaRepo is not provided')
        }
        return questsToTaxaRepo.findByQuestId(questId)
    }

    async function saveQuest(quest: Partial<Quest>): Promise<number> {
        const now = new Date()
        return base.create({
            ...quest,
            created_at: now,
            updated_at: now,
        })
    }

    async function update(id: number, data: Partial<Quest>): Promise<void> {
        const fields = Object.keys(data)
        const values = Object.values(data)

        if (fields.length === 0) return

        const setClause = fields.map((field) => `${field} = ?`).join(', ')
        await dbPool.query(
            `UPDATE quests SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [...values, id]
        )
    }

    async function updateStatus(id: number, status: string): Promise<void> {
        await dbPool.query(
            `UPDATE quests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, id]
        )
    }

    return {
        ...base,
        findById,
        findAccessibleById,
        findAccessibleByUserId,
        findTaxaForQuest,
        saveQuest,
        update,
        updateStatus,
    }
}

export type QuestToTaxa = {
    id: number
    quest_id: number
    taxon_id: number
}

export type QuestToTaxaRepository = ReturnType<
    typeof createQuestToTaxaRepository
>

export function createQuestToTaxaRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof QuestToTaxa)[]
) {
    const base = createBaseRepository<QuestToTaxa>(
        tableName,
        dbPool,
        validColumns
    )

    async function findByQuestId(questId: number): Promise<QuestToTaxa[]> {
        return base.findMany({ quest_id: questId })
    }

    async function addMapping(
        questId: number,
        taxonId: number
    ): Promise<number> {
        return base.create({ quest_id: questId, taxon_id: taxonId })
    }

    async function deleteMany(filter: { quest_id: number }) {
        await dbPool.query(`DELETE FROM ${tableName} WHERE quest_id = ?`, [
            filter.quest_id,
        ])
    }

    return {
        ...base,
        findByQuestId,
        addMapping,
        deleteMany,
    }
}
