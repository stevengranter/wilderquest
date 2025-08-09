import type { QuestRepository, QuestToTaxaRepository } from '../repositories/QuestRepository.js'
import type { QuestShareRepository, SharedQuestProgressRepository } from '../repositories/QuestShareRepository.js'

export type QuestShareService = ReturnType<typeof createQuestShareService>

export function createQuestShareService(
    questRepo: QuestRepository,
    questToTaxaRepo: QuestToTaxaRepository,
    questShareRepo: QuestShareRepository,
    progressRepo: SharedQuestProgressRepository
) {
    async function assertQuestOwnership(questId: number, userId: number) {
        const quest = await questRepo.findById(questId)
        if (!quest) throw new Error('Quest not found')
        if (quest.user_id !== userId) throw new Error('Access denied')
        return quest
    }

    async function createShare(
        questId: number,
        userId: number,
        data: { guest_name?: string | null; expires_at?: string | Date | null }
    ) {
        await assertQuestOwnership(questId, userId)
        const shareId = await questShareRepo.createShare({
            quest_id: questId,
            created_by_user_id: userId,
            guest_name: data.guest_name ?? null,
            expires_at: data.expires_at ? new Date(data.expires_at) : null,
        })
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new Error('Failed to create share')
        return share
    }

    async function listSharesForQuest(questId: number, userId: number) {
        await assertQuestOwnership(questId, userId)
        return questShareRepo.findByQuestId(questId)
    }

    async function deleteShare(shareId: number, userId: number) {
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new Error('Share not found')
        // Only the creator (quest owner) can delete
        if (share.created_by_user_id !== userId) throw new Error('Access denied')
        await questShareRepo.deleteShare(shareId)
        return { success: true }
    }

    async function getShareDetailsByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')

        const quest = await questRepo.findAccessibleById(share.quest_id)
        if (!quest) throw new Error('Quest not found')

        const taxaMappings = await questToTaxaRepo.findByQuestId(share.quest_id)
        const progress = await progressRepo.findByShareId(share.id)

        return {
            share,
            quest,
            taxa_mappings: taxaMappings, // contains id (mapping id) and taxon_id (iNat id)
            progress,
        }
    }

    async function getProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')
        return progressRepo.findByShareId(share.id)
    }

    async function setObservedByToken(
        token: string,
        mappingId: number,
        observed: boolean
    ) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')

        // Validate the mapping belongs to the quest of the share
        const mapping = await questToTaxaRepo.findOne({ id: mappingId })
        if (!mapping) throw new Error('Invalid taxon mapping')
        if ((mapping as any).quest_id !== share.quest_id) {
            throw new Error('Mapping does not belong to this quest')
        }

        if (observed) {
            try {
                await progressRepo.addProgress(share.id, mappingId)
            } catch (_err) {
                // ignore duplicates because of unique constraint
            }
        } else {
            await progressRepo.removeProgress(share.id, mappingId)
        }

        return progressRepo.findByShareId(share.id)
    }

    async function getAggregatedProgressForQuest(
        questId: number,
        viewerUserId?: number
    ) {
        // Ensure quest is accessible (public or owner)
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible) throw new Error('Quest not found or access denied')

        // Query progress across all shares for this quest
        const db = questShareRepo.getDb()
        const table = (questShareRepo as any).getTableName?.() || 'quest_shares'
        const [rows] = await db.query(
            `SELECT 
                 p.taxon_id AS mapping_id,
                 COUNT(*) AS count,
                 p_last.observed_at AS last_observed_at,
                 COALESCE(s_last.guest_name, u.username) AS last_display_name
             FROM shared_quest_progress p
             INNER JOIN ${table} s ON s.id = p.quest_share_id
             LEFT JOIN shared_quest_progress p_last
               ON p_last.taxon_id = p.taxon_id
             LEFT JOIN ${table} s_last ON s_last.id = p_last.quest_share_id
             LEFT JOIN users u ON u.id = s_last.created_by_user_id
             WHERE s.quest_id = ?
               AND s_last.quest_id = s.quest_id
               AND p_last.observed_at = (
                   SELECT MAX(p3.observed_at)
                   FROM shared_quest_progress p3
                   INNER JOIN ${table} s3 ON s3.id = p3.quest_share_id
                   WHERE p3.taxon_id = p.taxon_id AND s3.quest_id = s.quest_id
               )
             GROUP BY p.taxon_id, p_last.observed_at, COALESCE(s_last.guest_name, u.username)`,
            [questId]
        )
        return rows as Array<{
            mapping_id: number
            count: number
            last_observed_at: Date
            last_display_name: string | null
        }>
    }

    async function getQuestTaxaMappings(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible) throw new Error('Quest not found or access denied')
        return questToTaxaRepo.findByQuestId(questId)
    }

    async function getAggregatedProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')

        const db = questShareRepo.getDb()
        const table = (questShareRepo as any).getTableName?.() || 'quest_shares'
        const [rows] = await db.query(
            `SELECT 
                 p.taxon_id AS mapping_id,
                 COUNT(*) AS count,
                 p_last.observed_at AS last_observed_at,
                 COALESCE(s_last.guest_name, u.username) AS last_display_name
             FROM shared_quest_progress p
             INNER JOIN ${table} s ON s.id = p.quest_share_id
             LEFT JOIN shared_quest_progress p_last
               ON p_last.taxon_id = p.taxon_id
             LEFT JOIN ${table} s_last ON s_last.id = p_last.quest_share_id
             LEFT JOIN users u ON u.id = s_last.created_by_user_id
             WHERE s.quest_id = ?
               AND s_last.quest_id = s.quest_id
               AND p_last.observed_at = (
                   SELECT MAX(p3.observed_at)
                   FROM shared_quest_progress p3
                   INNER JOIN ${table} s3 ON s3.id = p3.quest_share_id
                   WHERE p3.taxon_id = p.taxon_id AND s3.quest_id = s.quest_id
               )
             GROUP BY p.taxon_id, p_last.observed_at, COALESCE(s_last.guest_name, u.username)`,
            [share.quest_id]
        )
        return rows as Array<{
            mapping_id: number
            count: number
            last_observed_at: Date
            last_display_name: string | null
        }>
    }

    async function setObservedAsOwner(
        questId: number,
        mappingId: number,
        observed: boolean,
        userId: number
    ) {
        // Ensure ownership
        await assertQuestOwnership(questId, userId)
        // Find or create an owner share for this quest (guest_name null)
        const possibleShares = await questShareRepo.findMany({
            quest_id: questId,
            created_by_user_id: userId,
        } as any)
        let share = possibleShares.find((s: any) => !s.guest_name) || null
        if (!share) {
            const shareId = await questShareRepo.createShare({
                quest_id: questId,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
            })
            share = await questShareRepo.findById(shareId)
        }

        if (!share) throw new Error('Unable to resolve owner share')

        if (observed) {
            try {
                await progressRepo.addProgress(share.id, mappingId)
            } catch (_err) {
                // ignore unique constraint violation
            }
        } else {
            await progressRepo.removeProgress(share.id, mappingId)
        }

        return true
    }

    async function getDetailedProgressForQuest(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible) throw new Error('Quest not found or access denied')

        const db = questShareRepo.getDb()
        const table = (questShareRepo as any).getTableName?.() || 'quest_shares'
        const [rows] = await db.query(
            `SELECT 
                p.id AS progress_id,
                p.taxon_id AS mapping_id,
                p.observed_at,
                s.id AS quest_share_id,
                COALESCE(s.guest_name, u.username) AS display_name
             FROM shared_quest_progress p
             INNER JOIN ${table} s ON s.id = p.quest_share_id
             LEFT JOIN users u ON u.id = s.created_by_user_id
             WHERE s.quest_id = ?
             ORDER BY p.observed_at DESC`,
            [questId]
        )
        return rows as Array<{
            progress_id: number
            mapping_id: number
            observed_at: Date
            quest_share_id: number
            display_name: string | null
        }>
    }

    async function deleteProgressEntry(
        questId: number,
        progressId: number,
        userId: number
    ) {
        await assertQuestOwnership(questId, userId)
        const db = questShareRepo.getDb()
        const table = (questShareRepo as any).getTableName?.() || 'quest_shares'
        await db.execute(
            `DELETE p FROM shared_quest_progress p
             INNER JOIN ${table} s ON s.id = p.quest_share_id
             WHERE p.id = ? AND s.quest_id = ?`,
            [progressId, questId]
        )
        return { success: true }
    }

    async function clearMappingProgress(
        questId: number,
        mappingId: number,
        userId: number
    ) {
        await assertQuestOwnership(questId, userId)
        const db = questShareRepo.getDb()
        const table = (questShareRepo as any).getTableName?.() || 'quest_shares'
        await db.execute(
            `DELETE p FROM shared_quest_progress p
             INNER JOIN ${table} s ON s.id = p.quest_share_id
             WHERE s.quest_id = ? AND p.taxon_id = ?`,
            [questId, mappingId]
        )
        return { success: true }
    }

    return {
        createShare,
        listSharesForQuest,
        deleteShare,
        getShareDetailsByToken,
        getProgressByToken,
        setObservedByToken,
        getAggregatedProgressForQuest,
        getQuestTaxaMappings,
        getAggregatedProgressByToken,
        setObservedAsOwner,
        getDetailedProgressForQuest,
        deleteProgressEntry,
        clearMappingProgress,
    }
}


