import { QuestServiceInstance } from '../services/QuestService.js'

export function createQuestController(questService: QuestServiceInstance) {
    async function getPublicQuests() {
        return questService.getAllPublicQuests()
    }

    async function getQuestById(id: number) {
        return questService.getQuestById(id)
    }

    return {
        getQuests: getPublicQuests,
        getQuestById: getQuestById,
    }
}

export type QuestController = ReturnType<typeof createQuestController>
