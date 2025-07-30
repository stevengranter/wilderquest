import { QuestRepositoryInstance, QuestToTaxaRepositoryInstance } from '../repositories/QuestRepository.js'

export type QuestServiceInstance = InstanceType<typeof QuestService>

export class QuestService {
    constructor(
        private questsRepo: QuestRepositoryInstance,
        private questsToTaxaRepo: QuestToTaxaRepositoryInstance
    ) {}

    async getAllPublicQuests() {
        return this.questsRepo.findMany({ is_private: false })
    }

    async getQuestById(id: number, userId?: number) {
        const collection = await this.questsRepo.findAccessibleById(id, userId)

        if (!collection) {
            throw new Error('Quest not found or access denied')
        }

        return collection
    }

    async getQuestsByUserId(userId: number) {
        return this.questsRepo.findAccessibleByUserId(userId)
    }

    async getTaxaForQuestId(questId: number) {
        return this.questsToTaxaRepo.findMany({ quest_id: questId })
    }
}
