import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { QuestServiceInstance } from '../services/questService.js'

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

    async function getQuestsByUserIdParam(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const userId = req.params.user_id
        try {
            const quests = await questService.getQuestsByUserId(Number(userId))
            res.status(200).json(quests)
            return
        } catch (_error) {
            res.status(404).json({
                message: 'Quests not found or access denied',
            })
        }
    }

    return {
        getQuests: getPublicQuests,
        getQuestById: getQuest,
        getQuestsByUserId: getQuestsByUserIdParam,
    }
}

export type QuestController = ReturnType<typeof createQuestController>
