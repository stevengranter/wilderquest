import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/verifyJWT.js'
import type { QuestShareService } from '../services/questShareService.js'

export function createQuestShareController(service: QuestShareService) {
    async function createShare(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ message: 'Unauthorized' })

        const questId = Number(req.params.questId)
        try {
            const share = await service.createShare(questId, userId, req.body)
            res.status(201).json(share)
        } catch (err) {
            res.status(400).json({ message: (err as Error).message })
        }
    }

    async function listShares(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ message: 'Unauthorized' })

        const questId = Number(req.params.questId)
        try {
            const shares = await service.listSharesForQuest(questId, userId)
            res.status(200).json(shares)
        } catch (err) {
            res.status(403).json({ message: (err as Error).message })
        }
    }

    async function deleteShare(req: AuthenticatedRequest, res: Response) {
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ message: 'Unauthorized' })

        const shareId = Number(req.params.shareId)
        try {
            await service.deleteShare(shareId, userId)
            res.status(204).send()
        } catch (err) {
            res.status(403).json({ message: (err as Error).message })
        }
    }

    async function getShareByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        try {
            const details = await service.getShareDetailsByToken(token)
            res.status(200).json(details)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function getProgress(req: Request, res: Response) {
        const token = String(req.params.token)
        try {
            const progress = await service.getProgressByToken(token)
            res.status(200).json(progress)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function setObserved(req: Request, res: Response) {
        const token = String(req.params.token)
        const mappingId = Number(req.params.mappingId)
        const observed = Boolean(req.body?.observed)
        try {
            const progress = await service.setObservedByToken(
                token,
                mappingId,
                observed
            )
            res.status(200).json(progress)
        } catch (err) {
            res.status(400).json({ message: (err as Error).message })
        }
    }

    async function getAggregatedProgressByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        try {
            const rows = await service.getAggregatedProgressByToken(token)
            res.status(200).json(rows)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function getAggregatedProgress(req: Request, res: Response) {
        const questId = Number(req.params.questId)
        try {
            const rows = await service.getAggregatedProgressForQuest(
                questId,
                (req as AuthenticatedRequest).user?.id
            )
            res.status(200).json(rows)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function getQuestTaxaMappings(req: Request, res: Response) {
        const questId = Number(req.params.questId)
        try {
            const rows = await service.getQuestTaxaMappings(
                questId,
                (req as AuthenticatedRequest).user?.id
            )
            res.status(200).json(rows)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function getLeaderboard(req: Request, res: Response) {
        const questId = Number(req.params.questId)
        try {
            const leaderboard = await service.getLeaderboardForQuest(
                questId,
                (req as AuthenticatedRequest).user?.id
            )
            res.status(200).json(leaderboard)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function getLeaderboardByToken(req: Request, res: Response) {
        const token = String(req.params.token)
        try {
            const leaderboard = await service.getLeaderboardForQuestByToken(token)
            res.status(200).json(leaderboard)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function setObservedAsOwner(
        req: AuthenticatedRequest,
        res: Response
    ) {
        console.log('setObservedAsOwner')
        const userId = req.user?.id
        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        console.log('userId: ' + userId)
        const questId = Number(req.params.questId)
        console.log('questId: ' + questId)
        const mappingId = Number(req.params.mappingId)
        console.log('mappingId: ' + mappingId)
        const observed = Boolean(req.body?.observed)
        console.log('observedId: ' + observed)
        try {
            await service.setObservedAsOwner(
                questId,
                mappingId,
                observed,
                userId
            )
            res.status(200).json({ success: true })
        } catch (err) {
            res.status(400).json({ message: (err as Error).message })
        }
    }

    async function getDetailedProgress(
        req: AuthenticatedRequest,
        res: Response
    ) {
        const questId = Number(req.params.questId)
        try {
            const rows = await service.getDetailedProgressForQuest(
                questId,
                req.user?.id
            )
            res.status(200).json(rows)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    async function deleteProgress(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.questId)
        const progressId = Number(req.params.progressId)
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
        try {
            await service.deleteProgressEntry(questId, progressId, req.user.id)
            res.status(204).send()
        } catch (err) {
            res.status(400).json({ message: (err as Error).message })
        }
    }

    async function clearMapping(req: AuthenticatedRequest, res: Response) {
        const questId = Number(req.params.questId)
        const mappingId = Number(req.params.mappingId)
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
        try {
            await service.clearMappingProgress(questId, mappingId, req.user.id)
            res.status(200).json({ success: true })
        } catch (err) {
            res.status(400).json({ message: (err as Error).message })
        }
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
    }
}

export type QuestShareController = ReturnType<typeof createQuestShareController>
