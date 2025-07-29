import {
    QuestRepositoryInstance,
    QuestToTaxaRepositoryInstance,
} from '../repositories/QuestRepository.js'

export type QuestServiceInstance = InstanceType<typeof QuestService>

export class QuestService {
    constructor(
        private questsRepo: QuestRepositoryInstance,
        private questsToTaxaRepo: QuestToTaxaRepositoryInstance
    ) {}

    async getAllPublicQuests() {
        return this.questsRepo.findMany({ is_private: false })
    }

    async getQuestById(id: number) {
        return this.questsRepo.findOne({ id })
    }

    async getTaxaForQuestId(questId: number) {
        return this.questsToTaxaRepo.findMany({ quest_id: questId })
    }
}
