import {
    QuestRepositoryInstance,
    QuestToTaxaRepositoryInstance,
} from '../repositories/QuestRepository.js'

export type QuestService = ReturnType<typeof createQuestService>

export function createQuestService(
    questsRepo: QuestRepositoryInstance,
    questsToTaxaRepo: QuestToTaxaRepositoryInstance
) {
    async function getAllPublicQuests() {
        try {
            return await questsRepo.findMany({ is_private: false })
        } catch (_error) {
            throw new Error('Error getting public quests')
        }
    }

    async function getQuestById(id: number, userId?: number) {
        const collection = await questsRepo.findAccessibleById(id, userId)

        if (!collection) {
            throw new Error('Quest not found or access denied')
        }

        return collection
    }

    async function getQuestsByUserId(userId: number) {
        return questsRepo.findAccessibleByUserId(userId)
    }

    async function getTaxaForQuestId(questId: number) {
        return questsToTaxaRepo.findMany({ quest_id: questId })
    }

    return {
        getAllPublicQuests,
        getQuestById,
        getQuestsByUserId,
        getTaxaForQuestId,
    }
}
