import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
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

export type AggregatedProgress = {
    mapping_id: number // p.taxon_id
    count: number // COUNT(*)
    last_observed_at: Date // p_last.observed_at
    last_display_name: string | null // COALESCE(s_last.guest_name, u.username)
}

export type DetailedProgress = {
    progress_id: number // p.id
    mapping_id: number // p.taxon_id
    observed_at: Date // p.observed_at
    quest_share_id: number // s.id
    display_name: string | null // COALESCE(s.guest_name, u.username)
}

export type LeaderboardEntry = {
    display_name: string | null
    observation_count: number
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
    const base = createBaseRepository<QuestShare>(
        tableName,
        dbPool,
        validColumns
    )

    async function findById(shareId: number): Promise<QuestShare | null> {
        const row = await base.findOne({ id: shareId })
        return (row as QuestShare) ?? null
    }

    async function findByToken(token: string): Promise<QuestShare | null> {
        const row = await base.findOne({ token })
        return (row as QuestShare) ?? null
    }

    async function findActiveByToken(
        token: string
    ): Promise<QuestShare | null> {
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

    async function findByShareId(
        shareId: number
    ): Promise<SharedQuestProgress[]> {
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
        const [result] = await dbPool.execute<ResultSetHeader>(
            `DELETE FROM ${tableName} WHERE quest_share_id = ? AND taxon_id = ?`,
            [quest_share_id, taxon_id]
        )
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows,
        }
    }

    async function getAggregatedProgress(
        questId: number
    ): Promise<AggregatedProgress[]> {
        const [rows] = await dbPool.query(
            `SELECT
                 p.taxon_id AS mapping_id,
                 COUNT(*) AS count,
                 p_last.observed_at AS last_observed_at,
                 COALESCE(s_last.guest_name, u.username) AS last_display_name
             FROM shared_quest_progress p
             INNER JOIN quest_shares s ON s.id = p.quest_share_id
             LEFT JOIN shared_quest_progress p_last
               ON p_last.taxon_id = p.taxon_id
             LEFT JOIN quest_shares s_last ON s_last.id = p_last.quest_share_id
             LEFT JOIN users u ON u.id = s_last.created_by_user_id
             WHERE s.quest_id = ?
               AND s_last.quest_id = s.quest_id
               AND p_last.observed_at = (
                   SELECT MAX(p3.observed_at)
                   FROM shared_quest_progress p3
                   INNER JOIN quest_shares s3 ON s3.id = p3.quest_share_id
                   WHERE p3.taxon_id = p.taxon_id AND s3.quest_id = s.quest_id
               )
             GROUP BY p.taxon_id, p_last.observed_at, COALESCE(s_last.guest_name, u.username)`,
            [questId]
        )
        return rows as AggregatedProgress[]
    }

    async function getDetailedProgress(
        questId: number
    ): Promise<DetailedProgress[]> {
        const [rows] = await dbPool.query(
            `SELECT
                p.id AS progress_id,
                p.taxon_id AS mapping_id,
                p.observed_at,
                s.id AS quest_share_id,
                COALESCE(s.guest_name, u.username) AS display_name
             FROM shared_quest_progress p
             INNER JOIN quest_shares s ON s.id = p.quest_share_id
             LEFT JOIN users u ON u.id = s.created_by_user_id
             WHERE s.quest_id = ?
             ORDER BY p.observed_at DESC`,
            [questId]
        )
        return rows as DetailedProgress[]
    }

    async function getLeaderboardProgress(
        questId: number
    ): Promise<LeaderboardEntry[]> {
        const [rows] = await dbPool.query(
            `SELECT 
                    COALESCE(s.guest_name, u.username) AS display_name,
                    COUNT(*) AS observation_count
                    FROM shared_quest_progress p
                    INNER JOIN quest_shares s ON s.id = p.quest_share_id
                    LEFT JOIN users u ON u.id = s.created_by_user_id
                    WHERE s.quest_id = ?
                    GROUP BY display_name
                    ORDER BY observation_count DESC, display_name ASC;
                `,
            [questId]
        )
        return rows as LeaderboardEntry[]
    }
    async function deleteProgressEntry(
        progressId: number,
        questId: number
    ): Promise<boolean> {
        const [result] = await dbPool.execute<ResultSetHeader>(
            `DELETE p FROM shared_quest_progress p
             INNER JOIN quest_shares s ON s.id = p.quest_share_id
             WHERE p.id = ? AND s.quest_id = ?`,
            [progressId, questId]
        )
        return result.affectedRows > 0
    }

    async function clearMappingProgress(
        questId: number,
        mappingId: number
    ): Promise<boolean> {
        const [result] = await dbPool.execute<ResultSetHeader>(
            `DELETE p FROM shared_quest_progress p
             INNER JOIN quest_shares s ON s.id = p.quest_share_id
             WHERE s.quest_id = ? AND p.taxon_id = ?`,
            [questId, mappingId]
        )
        return result.affectedRows > 0
    }

    return {
        ...base,
        findByShareId,
        addProgress,
        removeProgress,
        getAggregatedProgress,
        getDetailedProgress,
        getLeaderboardProgress,
        deleteProgressEntry,
        clearMappingProgress,
    }
}
