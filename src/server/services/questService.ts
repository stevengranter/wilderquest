import { Quest, QuestRepository, QuestToTaxaRepository, QuestWithTaxa } from '../repositories/QuestRepository.js'

export type QuestService = ReturnType<typeof createQuestService>

export function createQuestService(
    questsRepo: QuestRepository,
    questsToTaxaRepo: QuestToTaxaRepository
) {
    // 1. Get all public quests
    async function getAllPublicQuests(): Promise<Quest[]> {
        try {
            return await questsRepo.findMany({ is_private: false })
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
        viewerId?: number
    ): Promise<Quest[]> {
        return questsRepo.findAccessibleByUserId(targetUserId, viewerId)
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
            const { taxon_ids = [], ...questTableData } = questData

            const questId = await questsRepo.create({
                ...questTableData,
                user_id: userId, // enforce ownership here
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

        return {
            ...quest,
            taxon_ids: taxa.map((t) => t.taxon_id),
        }
    }

    // 7. Utility: Same as above, but with auth
    async function getAccessibleQuestWithTaxaById(
        questId: number,
        userId?: number
    ): Promise<QuestWithTaxa> {
        const quest = await questsRepo.findAccessibleById(questId, userId)
        if (!quest) throw new Error('Quest not found or access denied')

        const taxa = await getTaxaForQuestId(questId)

        return {
            ...quest,
            taxon_ids: taxa.map((t) => t.taxon_id),
        }
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

        const { taxon_ids, ...questTableData } = updatedData

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

    return {
        getAllPublicQuests,
        getAccessibleQuestById,
        getAccessibleQuestWithTaxaById,
        getUserQuests,
        getTaxaForQuestId,
        createQuest,
        getQuestWithTaxaById,
        updateQuest,
    }
}
