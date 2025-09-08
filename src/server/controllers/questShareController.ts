// src/controllers/questShareController.ts
import { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import type { QuestShareService } from '../services/questShareService.js'
import { AppError } from '../middlewares/errorHandler.js'

export function createQuestShareController(service: QuestShareService) {
    async function createShare(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const questId = Number(req.params.questId)
        const share = await service.createShare(questId, userId, req.body)
        res.status(201).json(share)
    }

    async function listShares(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const questId = Number(req.params.questId)
        const shares = await service.listSharesForQuest(questId, userId)
        res.status(200).json(shares)
    }

    async function deleteShare(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const shareId = Number(req.params.shareId)
        await service.deleteShare(shareId, userId)
        res.status(204).send()
    }

    async function getShareByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        const details = await service.getShareDetailsByToken(token)
        if (!details) throw new AppError('Share not found', 404)

        res.status(200).json(details)
    }

    async function getProgress(req: Request, res: Response) {
        const token = String(req.params.token)
        const progress = await service.getProgressByToken(token)
        res.status(200).json(progress)
    }

    async function setObserved(req: Request, res: Response) {
        const token = String(req.params.token)
        const mappingId = Number(req.params.mappingId)
        const observed = Boolean(req.body?.observed)

        const progress = await service.setObservedByToken(
            token,
            mappingId,
            observed
        )
        res.status(200).json(progress)
    }

    async function getAggregatedProgressByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        const rows = await service.getAggregatedProgressByToken(token)
        res.status(200).json(rows)
    }

    async function getAggregatedProgress(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const questId = Number(req.params.questId)
        const rows = await service.getAggregatedProgressForQuest(
            questId,
            req.user?.id
        )
        res.status(200).json(rows)
    }

    async function getQuestTaxaMappings(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const questId = Number(req.params.questId)
        const rows = await service.getQuestTaxaMappings(questId, req.user?.id)
        res.status(200).json(rows)
    }

    async function getLeaderboard(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.questId)
        const leaderboard = await service.getLeaderboardForQuest(
            questId,
            req.user?.id
        )
        res.status(200).json(leaderboard)
    }

    async function getLeaderboardByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        const leaderboard = await service.getLeaderboardForQuestByToken(token)
        res.status(200).json(leaderboard)
    }

    async function trackPageAccess(req: Request, res: Response) {
        const token = String(req.params.token)
        await service.trackPageAccess(token)
        res.status(200).json({ success: true })
    }

    async function setObservedAsOwner(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const userId = req.user?.id
        if (!userId) throw new AppError('Unauthorized', 401)

        const questId = Number(req.params.questId)
        const mappingId = Number(req.params.mappingId)
        const observed = Boolean(req.body?.observed)

        await service.setObservedAsOwner(questId, mappingId, observed, userId)
        res.status(200).json({ success: true })
    }

    async function getDetailedProgress(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const questId = Number(req.params.questId)
        const rows = await service.getDetailedProgressForQuest(
            questId,
            req.user?.id
        )
        res.status(200).json(rows)
    }

    async function deleteProgress(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.questId)
        const progressId = Number(req.params.progressId)
        if (!req.user) throw new AppError('Unauthorized', 401)

        await service.deleteProgressEntry(questId, progressId, req.user.id)
        res.status(204).send()
    }

    async function clearMapping(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.questId)
        const mappingId = Number(req.params.mappingId)
        if (!req.user) throw new AppError('Unauthorized', 401)

        await service.clearMappingProgress(questId, mappingId, req.user.id)
        res.status(200).json({ success: true })
    }

    return {
        createShare,
        listShares,
        deleteShare,
        getShareByToken,
        getProgress,
        getLeaderboard,
        getLeaderboardByToken,
        setObserved,
        getAggregatedProgressByToken,
        getAggregatedProgress,
        getQuestTaxaMappings,
        setObservedAsOwner,
        getDetailedProgress,
        deleteProgress,
        clearMapping,
        trackPageAccess,
    }
}

export type QuestShareController = ReturnType<typeof createQuestShareController>
