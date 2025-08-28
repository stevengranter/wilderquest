import { QuestRepository, QuestToTaxaRepository, QuestWithTaxa } from '../../repositories/QuestRepository.js'
import { QuestShareRepository } from '../../repositories/QuestShareRepository.js'
import { iNatService } from '../iNatService.js'
import { sendEvent } from './questEventsService.js'
import { Quest } from '../../models/quests.js'

export type QuestService = ReturnType<typeof createQuestService>

export function createQuestService(
    questsRepo: QuestRepository,
    questsToTaxaRepo: QuestToTaxaRepository,
    questShareRepo: QuestShareRepository
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
            const questsWithTaxaAndPhotos = await Promise.all(
                quests.map(async (quest) => {
                    const taxa = await getTaxaForQuestId(quest.id)
                    const taxon_ids = taxa
                        .map((t) => t.taxon_id)
                        .filter((id) => id && typeof id === 'number' && id > 0)
                    const photoUrl =
                        taxon_ids.length > 0
                            ? await iNatService.getTaxonPhoto(taxon_ids[0])
                            : null
                    return {
                        ...quest,
                        taxon_ids,
                        photoUrl,
                    }
                })
            )
            return questsWithTaxaAndPhotos
        } catch (error) {
            console.error('Error in getAllPublicQuests:', error)
            throw new Error('Error getting public quests')
        }
    }

    // 2. Get a quest that the user is allowed to access (public or owned)
    async function getAccessibleQuestById(
        id: number,
        userId?: number
    ): Promise<Quest> {
        const quest = await questsRepo.findAccessibleById(id, userId)

        if (!quest) {
            throw new Error('Quest not found or access denied')
        }

        return quest
    }

    // 3. Get a user's visible quests (all their own, or public ones if not their account)
    async function getUserQuests(
        targetUserId: number,
        viewerId?: number,
        page: number = 1,
        limit: number = 10
    ): Promise<QuestWithTaxa[]> {
        const offset = (page - 1) * limit
        const quests = await questsRepo.findAccessibleByUserId(
            targetUserId,
            viewerId,
            limit,
            offset
        )
        const questsWithTaxaAndPhotos = await Promise.all(
            quests.map(async (quest) => {
                const taxa = await getTaxaForQuestId(quest.id)
                const taxon_ids = taxa
                    .map((t) => t.taxon_id)
                    .filter((id) => id && typeof id === 'number' && id > 0)
                const photoUrl =
                    taxon_ids.length > 0
                        ? await iNatService.getTaxonPhoto(taxon_ids[0])
                        : null
                return {
                    ...quest,
                    taxon_ids,
                    photoUrl,
                }
            })
        )
        return questsWithTaxaAndPhotos
    }

    // 4. Get all taxon mappings for a quest
    async function getTaxaForQuestId(questId: number) {
        return questsToTaxaRepo.findMany({ quest_id: questId })
    }

    // 5. Create a new quest (must be owner)
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
                mode: restQuestData.mode || 'cooperative', // Default to cooperative if not specified
            }

            const questId = await questsRepo.create({
                ...questTableData,
                user_id: userId, // enforce ownership here
                status: 'pending', // explicitly set status to avoid constraint violation
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

            // Create owner share
            await questShareRepo.createShare({
                quest_id: questId,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
            })

            return getQuestWithTaxaById(questId)
        } catch (error) {
            console.error('Error in createQuest:', error)
            throw new Error('Failed to create quest')
        }
    }

    // 6. Utility: Return quest + taxon_ids
    async function getQuestWithTaxaById(
        questId: number
    ): Promise<QuestWithTaxa> {
        const quest = await questsRepo.findById(questId)
        if (!quest) throw new Error('Quest not found')

        const taxa = await getTaxaForQuestId(questId)

        // Filter out invalid taxon IDs
        const validTaxonIds = taxa
            .map((t) => t.taxon_id)
            .filter((id) => id && typeof id === 'number' && id > 0)

        return {
            ...quest,
            taxon_ids: validTaxonIds,
        }
    }

    // 7. Utility: Same as above, but with auth
    async function getAccessibleQuestWithTaxaById(
        questId: number,
        userId?: number
    ): Promise<QuestWithTaxa> {
        const quest = await questsRepo.findAccessibleById(questId, userId)
        if (!quest) throw new Error('Quest not found or access denied')
        return quest
    }

    async function updateQuest(
        questId: number,
        updatedData: Partial<QuestWithTaxa>,
        userId: number
    ): Promise<QuestWithTaxa> {
        // Get the original quest
        const existingQuest = await questsRepo.findById(questId)
        if (!existingQuest) {
            throw new Error('Quest not found')
        }

        // Authorization: only owner can update
        if (existingQuest.user_id !== userId) {
            throw new Error('Access denied')
        }

        const {
            taxon_ids,
            description: _description,
            starts_at,
            ends_at,
            ...restQuestData
        } = updatedData

        const questTableData = {
            ...restQuestData,
            starts_at: starts_at ? new Date(starts_at) : undefined,
            ends_at: ends_at ? new Date(ends_at) : undefined,
        }

        // Update the quest (exclude undefined fields)
        if (Object.keys(questTableData).length > 0) {
            await questsRepo.update(questId, questTableData)
        }

        // Sync taxon_ids if provided
        if (taxon_ids) {
            // Delete all old mappings
            await questsToTaxaRepo.deleteMany({ quest_id: questId })

            // Insert new mappings
            await Promise.all(
                taxon_ids.map((taxonId) =>
                    questsToTaxaRepo.create({
                        quest_id: questId,
                        taxon_id: taxonId,
                    })
                )
            )
        }

        // Return the updated quest with taxa
        return await getQuestWithTaxaById(questId)
    }

    async function updateQuestStatus(
        questId: number,
        status: string,
        userId: number
    ): Promise<void> {
        const existingQuest = await questsRepo.findById(questId)
        if (!existingQuest) {
            throw new Error('Quest not found')
        }

        if (existingQuest.user_id !== userId) {
            throw new Error('Access denied')
        }

        if (!['pending', 'active', 'paused', 'ended'].includes(status)) {
            throw new Error('Invalid status')
        }

        await questsRepo.updateStatus(questId, status)

        sendEvent(String(questId), {
            type: 'QUEST_STATUS_UPDATED',
            payload: { status },
        })
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
