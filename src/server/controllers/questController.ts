// src/controllers/questController.ts
import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import { QuestService } from '../services/questService.js'
import { AppError } from '../middlewares/errorHandler.js' // make sure AppError is exported

export function createQuestController(questService: QuestService) {
    // Get all public quests
    async function getPublicQuests(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const quests = await questService.getAllPublicQuests(page, limit)
        res.status(200).json(quests)
    }

    // Get a single quest by ID (with auth check)
    async function getQuest(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id

        const quest = await questService.getAccessibleQuestWithTaxaById(
            questId,
            userId
        )
        if (!quest) throw new AppError('Quest not found or access denied', 404)

        res.status(200).json(quest)
    }

    // Get quests for a specific user
    async function getQuestsByUserIdParam(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const userId = Number(req.params.user_id)
        const viewerId = req.user?.id
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10

        const quests = await questService.getUserQuests(
            userId,
            viewerId,
            page,
            limit
        )

        res.status(200).json(quests)
    }

    // Create a new quest
    async function createQuest(req: AuthenticatedRequest, res: Response) {
        if (!req.user)
            throw new AppError('You must be logged in to access this page', 401)

        const quest = await questService.createQuest(req.body, req.user.id)
        res.status(201).json(quest)
    }

    // Update a quest
    async function updateQuest(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const updatedQuest = await questService.updateQuest(
            questId,
            req.body,
            userId
        )
        res.status(200).json(updatedQuest)
    }

    // Update quest status
    async function updateQuestStatus(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.id)
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const { status } = req.body
        await questService.updateQuestStatus(questId, status, userId)
        res.status(200).json({ message: 'Quest status updated successfully' })
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
