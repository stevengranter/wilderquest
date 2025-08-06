import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { QuestService } from '../services/questService.js'

export function createQuestController(questService: QuestService) {
    async function getPublicQuests(req: Request, res: Response) {
        const quests = await questService.getAllPublicQuests()
        res.status(200).json(quests)
        return
    }

    async function getQuest(req: AuthenticatedRequest, res: Response) {
        console.log('getQuest')
        const questId = Number(req.params.id)
        console.log('Quest ID: ', questId)
        const userId = req.user?.id
        console.log('User ID: ', userId)

        try {
            const quest = await questService.getQuestByIdWithTaxa(questId)
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
        const userId = Number(req.params.user_id)
        const viewerId = req.user?.id
        console.log('getQuestsByUserIdParam', userId)
        try {
            const quests = await questService.getUserQuests(userId, viewerId)
            res.status(200).json(quests)
            return
        } catch (_error) {
            res.status(404).json({
                message: 'Quests not found or access denied',
            })
        }
    }

    async function createQuest(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            res.status(401).json('You must be logged in to access this page')
            return
        }
        const quest = await questService.createQuest(req.body, req.user.id)
        console.log(quest)
        res.status(200).json(quest)
    }

    return {
        getQuests: getPublicQuests,
        getQuestById: getQuest,
        getQuestsByUserId: getQuestsByUserIdParam,
        createQuest: createQuest,
    }
}

export type QuestController = ReturnType<typeof createQuestController>
