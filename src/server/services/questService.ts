import {
    QuestRepository,
    QuestToTaxaRepository,
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

    return {
        getAllPublicQuests,
        getQuestById,
        getUserQuests,
        getTaxaForQuestId,
    }
}
