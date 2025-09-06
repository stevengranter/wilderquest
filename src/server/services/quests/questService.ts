import {
    QuestRepository,
    QuestToTaxaRepository,
    QuestWithTaxa,
} from '../../repositories/QuestRepository.js'
import {
    QuestShareRepository,
    SharedQuestProgressRepository,
} from '../../repositories/QuestShareRepository.js'
import { iNatService } from '../iNatService.js'
import { sendEvent } from './questEventsService.js'
import { Quest } from '../../models/quests.js'
import { AppError } from '../../middlewares/errorHandler.js'

export type QuestService = ReturnType<typeof createQuestService>

export function createQuestService(
    questsRepo: QuestRepository,
    questsToTaxaRepo: QuestToTaxaRepository,
    questShareRepo: QuestShareRepository,
    sharedQuestProgressRepo?: SharedQuestProgressRepository
) {
    // 1. Get all public quests
    async function getAllPublicQuests(
        page: number = 1,
        limit: number = 10
    ): Promise<QuestWithTaxa[]> {
        try {
            const offset = (page - 1) * limit
            const quests = await questsRepo.findMany(
                { is_private: false },
                { limit, offset }
            )
            const questsWithTaxa = await Promise.all(
                quests.map(async (quest) => {
                    const taxa = await getTaxaForQuestId(quest.id)
                    const taxon_ids = taxa
                        .map((t) => t.taxon_id)
                        .filter((id) => id && typeof id === 'number' && id > 0)
                    const photoUrl = null // Disable server-side photo fetching to prevent 429 errors
                    return {
                        ...quest,
                        taxon_ids,
                        photoUrl,
                    }
                })
            )
            return questsWithTaxa
        } catch (error) {
            console.error('Error in getAllPublicQuests:', error)
            throw new AppError('Failed to retrieve public quests', 500)
        }
    }

    // 2. Get a quest that the user is allowed to access (public or owned)
    async function getAccessibleQuestById(
        id: number,
        userId?: number
    ): Promise<Quest> {
        const quest = await questsRepo.findAccessibleById(id, userId)
        if (!quest) throw new AppError('Quest not found or access denied', 404)
        return quest
    }

    // 3. Get a user's visible quests
    async function getUserQuests(
        targetUserId: number,
        viewerId?: number,
        page: number = 1,
        limit: number = 10
    ): Promise<QuestWithTaxa[]> {
        try {
            const offset = (page - 1) * limit
            const quests = await questsRepo.findAccessibleByUserId(
                targetUserId,
                viewerId,
                limit,
                offset
            )
            const questsWithTaxa = await Promise.all(
                quests.map(async (quest) => {
                    const taxa = await getTaxaForQuestId(quest.id)
                    const taxon_ids = taxa
                        .map((t) => t.taxon_id)
                        .filter((id) => id && typeof id === 'number' && id > 0)
                    const photoUrl = null // Disable server-side photo fetching to prevent 429 errors
                    return {
                        ...quest,
                        taxon_ids,
                        photoUrl,
                    }
                })
            )
            return questsWithTaxa
        } catch (error) {
            console.error('Error in getUserQuests:', error)
            throw new AppError('Failed to retrieve user quests', 500)
        }
    }

    // 4. Get all taxon mappings for a quest
    async function getTaxaForQuestId(questId: number) {
        return questsToTaxaRepo.findMany({ quest_id: questId })
    }

    // 5. Create a new quest
    async function createQuest(
        questData: Partial<QuestWithTaxa>,
        userId: number
    ): Promise<QuestWithTaxa> {
        try {
            const {
                taxon_ids = [],
                starts_at,
                ends_at,
                ...restQuestData
            } = questData

            const questTableData = {
                ...restQuestData,
                starts_at: starts_at ? new Date(starts_at) : null,
                ends_at: ends_at ? new Date(ends_at) : null,
                mode: restQuestData.mode || 'cooperative',
            }

            const questId = await questsRepo.create({
                ...questTableData,
                user_id: userId,
                status: 'pending',
            })

            if (taxon_ids.length > 0) {
                await Promise.all(
                    taxon_ids.map((taxonId) =>
                        questsToTaxaRepo.create({
                            quest_id: questId,
                            taxon_id: taxonId,
                        })
                    )
                )
            }

            await questShareRepo.createShare({
                quest_id: questId,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
            })

            return getQuestWithTaxaById(questId)
        } catch (error) {
            console.error('Error in createQuest:', error)
            throw new AppError('Failed to create quest', 500)
        }
    }

    // 6. Return quest + taxon_ids
    async function getQuestWithTaxaById(
        questId: number
    ): Promise<QuestWithTaxa> {
        const quest = await questsRepo.findById(questId)
        if (!quest) throw new AppError('Quest not found', 404)

        const taxa = await getTaxaForQuestId(questId)
        const validTaxonIds = taxa
            .map((t) => t.taxon_id)
            .filter((id) => id && typeof id === 'number' && id > 0)

        return { ...quest, taxon_ids: validTaxonIds }
    }

    // 7. Auth-aware quest retrieval
    async function getAccessibleQuestWithTaxaById(
        questId: number,
        userId?: number
    ): Promise<QuestWithTaxa> {
        const quest = await questsRepo.findAccessibleById(questId, userId)
        if (!quest) throw new AppError('Quest not found or access denied', 404)
        return quest
    }

    // 8. Update quest
    async function updateQuest(
        questId: number,
        updatedData: Partial<QuestWithTaxa>,
        userId: number
    ): Promise<QuestWithTaxa> {
        const existingQuest = await questsRepo.findById(questId)
        if (!existingQuest) throw new AppError('Quest not found', 404)
        if (existingQuest.user_id !== userId)
            throw new AppError('Access denied', 403)

        const { taxon_ids, starts_at, ends_at, ...rest } = updatedData
        const questTableData = {
            ...rest,
            starts_at: starts_at ? new Date(starts_at) : undefined,
            ends_at: ends_at ? new Date(ends_at) : undefined,
        }

        if (Object.keys(questTableData).length > 0) {
            await questsRepo.update(questId, questTableData)
        }

        if (taxon_ids !== undefined) {
            await updateQuestTaxaPreservingProgress(questId, taxon_ids)
        }

        return getQuestWithTaxaById(questId)
    }

    // 9. Update quest status
    async function updateQuestStatus(
        questId: number,
        status: string,
        userId: number
    ): Promise<void> {
        const existingQuest = await questsRepo.findById(questId)
        if (!existingQuest) throw new AppError('Quest not found', 404)
        if (existingQuest.user_id !== userId)
            throw new AppError('Access denied', 403)
        if (!['pending', 'active', 'paused', 'ended'].includes(status)) {
            throw new AppError('Invalid status', 400)
        }

        await questsRepo.updateStatus(questId, status)

        sendEvent(String(questId), {
            type: 'QUEST_STATUS_UPDATED',
            payload: { status },
        })

        // Send additional event for editing notification
        if (status === 'paused') {
            sendEvent(String(questId), {
                type: 'QUEST_EDITING_STARTED',
                payload: {
                    message:
                        'The quest creator has started editing this quest. Progress tracking is temporarily paused.',
                },
            })
        }
    }

    // Helper function to update quest taxa while preserving progress
    async function updateQuestTaxaPreservingProgress(
        questId: number,
        newTaxonIds: number[]
    ): Promise<void> {
        // Get existing mappings
        const existingMappings = await getTaxaForQuestId(questId)
        const existingTaxonIds = existingMappings.map((m) => m.taxon_id)

        // Find taxa to add and remove
        const taxaToAdd = newTaxonIds.filter(
            (id) => !existingTaxonIds.includes(id)
        )
        const taxaToRemove = existingTaxonIds.filter(
            (id) => !newTaxonIds.includes(id)
        )

        // Remove mappings for taxa that are no longer in the quest
        if (taxaToRemove.length > 0) {
            const mappingsToRemove = existingMappings.filter((m) =>
                taxaToRemove.includes(m.taxon_id)
            )

            // Delete progress records for removed taxa (if progress repo is available)
            if (sharedQuestProgressRepo) {
                await Promise.all(
                    mappingsToRemove.map((mapping) =>
                        sharedQuestProgressRepo!.clearMappingProgress(
                            questId,
                            mapping.id
                        )
                    )
                )
            }

            // Delete the mappings themselves
            await Promise.all(
                mappingsToRemove.map((mapping) =>
                    questsToTaxaRepo.delete(mapping.id)
                )
            )
        }

        // Add new mappings for taxa that were added
        if (taxaToAdd.length > 0) {
            await Promise.all(
                taxaToAdd.map((taxonId) =>
                    questsToTaxaRepo.create({
                        quest_id: questId,
                        taxon_id: taxonId,
                    })
                )
            )
        }

        // Taxa that are kept don't need any changes - their mappings and progress remain intact
    }

    return {
        getAllPublicQuests,
        getAccessibleQuestById,
        getAccessibleQuestWithTaxaById,
        getUserQuests,
        getTaxaForQuestId,
        createQuest,
        getQuestWithTaxaById,
        updateQuest,
        updateQuestStatus,
    }
}
