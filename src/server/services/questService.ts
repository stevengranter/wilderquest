import {
    Quest,
    QuestRepository,
    QuestToTaxaRepository,
    QuestWithTaxa,
} from '../repositories/QuestRepository.js'

export type QuestService = ReturnType<typeof createQuestService>

export function createQuestService(
    questsRepo: QuestRepository,
    questsToTaxaRepo: QuestToTaxaRepository
) {
    async function getAllPublicQuests() {
        try {
            return await questsRepo.findMany({ is_private: false })
        } catch (error) {
            console.error('Error in getAllPublicQuests:', error)
            throw new Error('Error getting public quests')
        }
    }

    async function getQuestById(id: number, userId?: number) {
        const collection = await questsRepo.findAccessibleById(id, userId)
        console.log(collection)

        if (!collection) {
            throw new Error('Quest not found or access denied')
        }

        return collection
    }

    async function getUserQuests(targetUserId: number, viewerId?: number) {
        return questsRepo.findAccessibleByUserId(targetUserId, viewerId)
    }

    async function getTaxaForQuestId(questId: number) {
        return questsToTaxaRepo.findMany({ quest_id: questId })
    }

    async function createQuest(
        questData: Partial<QuestWithTaxa>,
        userId: number
    ): Promise<QuestWithTaxa> {
        try {
            // Destructure and separate taxon_ids
            const { taxon_ids = [], ...questTableData } = questData

            // Always set user_id from authenticated user, not client data
            const questId = await questsRepo.create({
                ...questTableData,
                user_id: userId,
            })

            // Insert into questToTaxa table if taxa were provided
            if (Array.isArray(taxon_ids) && taxon_ids.length > 0) {
                await Promise.all(
                    taxon_ids.map((taxonId) =>
                        questsToTaxaRepo.create({
                            quest_id: questId,
                            taxon_id: taxonId,
                        })
                    )
                )
            }

            // Return full quest with taxa
            const quest = await questsRepo.findById(questId)
            const taxa = await questsToTaxaRepo.findMany({ quest_id: questId })

            return {
                ...(quest as Quest),
                taxon_ids: taxa.map((t) => t.taxon_id),
            }
        } catch (error) {
            console.error('Error in createQuest:', error)
            throw new Error('Failed to create quest')
        }
    }

    return {
        getAllPublicQuests,
        getQuestById,
        getUserQuests,
        getTaxaForQuestId,
        createQuest,
    }
}
