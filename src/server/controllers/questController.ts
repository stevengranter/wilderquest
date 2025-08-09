import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { QuestService } from '../services/questService.js'

export function createQuestController(questService: QuestService) {
    async function getPublicQuests(req: Request, res: Response) {
        const quests = await questService.getAllPublicQuests()
        res.status(200).json(quests)
    }

    async function getQuest(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id

        try {
            // ✅ Use the secure version with auth check
            const quest = await questService.getAccessibleQuestWithTaxaById(
                questId,
                userId
            )
            res.status(200).json(quest)
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

        try {
            const quests = await questService.getUserQuests(userId, viewerId)
            res.status(200).json(quests)
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

        try {
            const quest = await questService.createQuest(req.body, req.user.id)
            res.status(201).json(quest)
        } catch (_err) {
            res.status(400).json({ message: 'Failed to create quest' })
        }
    }

    async function updateQuest(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        try {
            const updatedQuest = await questService.updateQuest(
                questId,
                req.body,
                userId
            )
            res.status(200).json(updatedQuest)
        } catch (error) {
            res.status(403).json({ message: (error as Error).message })
        }
    }

    async function updateQuestStatus(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id
        const { status } = req.body

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        try {
            await questService.updateQuestStatus(questId, status, userId)
            res.status(200).json({ message: 'Quest status updated successfully' })
        } catch (error) {
            res.status(403).json({ message: (error as Error).message })
        }
    }

    return {
        getQuests: getPublicQuests,
        getQuestById: getQuest,
        getQuestsByUserId: getQuestsByUserIdParam,
        createQuest,
        updateQuest,
        updateQuestStatus,
    }
}

export type QuestController = ReturnType<typeof createQuestController>
