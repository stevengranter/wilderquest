import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { QuestServiceInstance } from '../services/QuestService.js'

export function createQuestController(questService: QuestServiceInstance) {
    async function getPublicQuests(req: Request, res: Response) {
        const quests = await questService.getAllPublicQuests()
        res.status(200).json(quests)
        return
    }

    async function getQuest(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id

        try {
            const quest = await questService.getQuestById(questId, userId)
            res.status(200).json(quest)
            return
        } catch (_error) {
            res.status(404).json({
                message: 'Quest not found or access denied',
            })
        }
    }



    return {
        getQuests: getPublicQuests,
        getQuestById: getQuest,
    }
}

export type QuestController = ReturnType<typeof createQuestController>
