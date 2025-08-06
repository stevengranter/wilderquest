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

export function createQuestRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof Quest)[],
    questsToTaxaRepo?: ReturnType<typeof createQuestToTaxaRepository>
) {
    const base = createBaseRepository<Quest>(tableName, dbPool, validColumns)

    async function findAccessibleById(
        id: number,
        userId?: number
    ): Promise<Quest | null> {
        const query = `
      SELECT * FROM ${tableName}
      WHERE id = ?
        AND (is_private = FALSE OR user_id = ?)
      LIMIT 1
    `
        const [rows] = await base
            .getDb()
            .execute<RowDataPacket[]>(query, [id, userId ?? -1])
        return rows.length > 0 ? (rows[0] as Quest) : null
    }

    async function findAccessibleByUserId(userId: number, viewerId?: number) {
        const isOwner = userId === viewerId
        console.log('isOwner', isOwner)
        console.log('userId', userId)

        if (isOwner) {
            // return all quests (public and private)
            const [rows] = await dbPool.query(
                `SELECT * FROM quests WHERE user_id = ?`,
                [userId]
            )
            return rows
        } else {
            // only return public quests
            console.log('getting public quests')
            const [rows] = await dbPool.query(
                `SELECT * FROM quests WHERE user_id = ? AND is_private = false`,
                [userId]
            )
            return rows
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

    async function updateQuest(
        id: number,
        questData: Partial<Quest>
    ): Promise<{ success: boolean; affectedRows: number }> {
        const now = new Date()
        const data = { ...questData, updated_at: now }
        return await base.update(id, data)
    }

    return {
        ...base,
        findAccessibleById,
        findAccessibleByUserId,
        findTaxaForQuest,
        saveQuest,
        updateQuest,
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

    return {
        ...base,
        findByQuestId,
        addMapping,
    }
}
