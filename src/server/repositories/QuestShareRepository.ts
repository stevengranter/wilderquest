import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { createBaseRepository } from './BaseRepository.js'
import { QuestShare } from '../models/quest_shares.js'
import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    SharedQuestProgress,
} from '../models/shared_quest_progress.js'

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
                    CASE
                      WHEN s_last.guest_name IS NOT NULL THEN s_last.guest_name
                      WHEN s_last.is_primary = TRUE THEN u.username
                      ELSE 'Guest'
                    END AS last_display_name
               FROM shared_quest_progress p
               INNER JOIN quest_shares s ON s.id = p.quest_share_id
                LEFT JOIN (
                    SELECT p3.taxon_id, p3.quest_share_id, p3.observed_at
                    FROM shared_quest_progress p3
                    INNER JOIN quest_shares s3 ON s3.id = p3.quest_share_id
                    WHERE s3.quest_id = ?
                    AND p3.observed_at = (
                        SELECT MAX(p4.observed_at)
                        FROM shared_quest_progress p4
                        INNER JOIN quest_shares s4 ON s4.id = p4.quest_share_id
                        WHERE p4.taxon_id = p3.taxon_id AND s4.quest_id = s3.quest_id
                    )
                    ORDER BY p3.id ASC
                    LIMIT 1
                ) p_last ON p_last.taxon_id = p.taxon_id
                LEFT JOIN quest_shares s_last ON s_last.id = p_last.quest_share_id
               LEFT JOIN users u ON u.id = s_last.created_by_user_id
               INNER JOIN quests q ON q.id = s.quest_id
                WHERE s.quest_id = ?
                GROUP BY p.taxon_id, p_last.observed_at, s_last.guest_name, s_last.created_by_user_id, u.username, q.user_id, s_last.id`,
            [questId, questId]
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
                   CASE
                     WHEN s.guest_name IS NOT NULL THEN s.guest_name
                     WHEN s.is_primary = TRUE THEN u.username
                     ELSE 'Guest'
                   END AS display_name
               FROM shared_quest_progress p
               INNER JOIN quest_shares s ON s.id = p.quest_share_id
               LEFT JOIN users u ON u.id = s.created_by_user_id
               INNER JOIN quests q ON q.id = s.quest_id
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
                        CASE
                          WHEN s.guest_name IS NOT NULL THEN s.guest_name
                          WHEN s.is_primary = TRUE THEN u.username
                          ELSE 'Guest'
                        END AS display_name,
                       COUNT(p.id) AS observation_count,
                       s.first_accessed_at IS NOT NULL AS has_accessed_page,
                       MAX(p.observed_at) AS last_progress_at,
                       s.created_at AS invited_at
                       FROM quest_shares s
                       LEFT JOIN users u ON u.id = s.created_by_user_id
                       LEFT JOIN shared_quest_progress p ON p.quest_share_id = s.id
                       INNER JOIN quests q ON q.id = s.quest_id
                       WHERE s.quest_id = ?
                       GROUP BY s.id, s.guest_name, s.created_by_user_id, u.username, s.first_accessed_at, s.created_at, q.user_id
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

    async function updateShare(
        shareId: number,
        updates: Partial<
            Pick<QuestShare, 'first_accessed_at' | 'last_accessed_at'>
        >
    ): Promise<boolean> {
        const updateFields = Object.keys(updates).filter(
            (key) => updates[key as keyof typeof updates] !== undefined
        )
        if (updateFields.length === 0) return false

        const setClause = updateFields.map((field) => `${field} = ?`).join(', ')
        const values = updateFields.map(
            (field) => updates[field as keyof typeof updates]
        )

        const [result] = await dbPool.execute<ResultSetHeader>(
            `UPDATE quest_shares SET ${setClause} WHERE id = ?`,
            [...values, shareId]
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
        updateShare,
    }
}

export type QuestShareRepository = ReturnType<typeof createQuestShareRepository>
export type SharedQuestProgressRepository = ReturnType<
    typeof createSharedQuestProgressRepository
>
