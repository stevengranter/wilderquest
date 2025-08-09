import { Pool, RowDataPacket } from 'mysql2/promise'
import { createBaseRepository } from './BaseRepository.js'

export type QuestShare = {
    id: number
    token: string
    quest_id: number
    created_by_user_id: number
    guest_name?: string | null
    expires_at?: Date | null
    created_at: Date
    updated_at: Date
}

export type SharedQuestProgress = {
    id: number
    quest_share_id: number
    taxon_id: number // refers to quests_to_taxa.id
    observed_at: Date
}

export type QuestShareRepository = ReturnType<typeof createQuestShareRepository>
export type SharedQuestProgressRepository = ReturnType<
    typeof createSharedQuestProgressRepository
>

export function createQuestShareRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof QuestShare)[]
) {
    const base = createBaseRepository<QuestShare>(tableName, dbPool, validColumns)

    async function findById(shareId: number): Promise<QuestShare | null> {
        const row = await base.findOne({ id: shareId })
        return (row as QuestShare) ?? null
    }

    async function findByToken(token: string): Promise<QuestShare | null> {
        const row = await base.findOne({ token })
        return (row as QuestShare) ?? null
    }

    async function findActiveByToken(token: string): Promise<QuestShare | null> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName}
             WHERE token = ?
               AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
             LIMIT 1`,
            [token]
        )
        if (rows.length === 0) return null
        return rows[0] as QuestShare
    }

    async function findByQuestId(questId: number): Promise<QuestShare[]> {
        return base.findMany({ quest_id: questId })
    }

    async function createShare(data: Partial<QuestShare>): Promise<number> {
        // created_at/updated_at handled by DB defaults
        return base.create(data)
    }

    async function deleteShare(shareId: number) {
        return base.delete(shareId)
    }

    return {
        ...base,
        findById,
        findByToken,
        findActiveByToken,
        findByQuestId,
        createShare,
        deleteShare,
    }
}

export function createSharedQuestProgressRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof SharedQuestProgress)[]
) {
    const base = createBaseRepository<SharedQuestProgress>(
        tableName,
        dbPool,
        validColumns
    )

    async function findByShareId(shareId: number): Promise<SharedQuestProgress[]> {
        return base.findMany({ quest_share_id: shareId })
    }

    async function addProgress(
        quest_share_id: number,
        taxon_id: number
    ): Promise<number> {
        return base.create({ quest_share_id, taxon_id })
    }

    async function removeProgress(
        quest_share_id: number,
        taxon_id: number
    ): Promise<{ success: boolean; affectedRows: number }> {
        const [result] = await dbPool.execute<RowDataPacket[]>(
            `DELETE FROM ${tableName} WHERE quest_share_id = ? AND taxon_id = ?`,
            [quest_share_id, taxon_id]
        )
        // mysql2 returns ResultSetHeader for execute on DELETE, but using RowDataPacket typing here to avoid import duplication
        // We will surface a boolean based on affectedRows if present
        const anyResult: any = result
        return {
            success: (anyResult?.affectedRows ?? 0) > 0,
            affectedRows: anyResult?.affectedRows ?? 0,
        }
    }

    return {
        ...base,
        findByShareId,
        addProgress,
        removeProgress,
    }
}



