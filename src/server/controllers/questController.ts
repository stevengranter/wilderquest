import { QuestServiceInstance } from '../services/QuestService.js'

export function createQuestController(questService: QuestServiceInstance) {
    async function getPublicQuests() {
        return questService.getAllPublicQuests()
    }

    return { getQuests: getPublicQuests }
}

export type QuestController = ReturnType<typeof createQuestController>
