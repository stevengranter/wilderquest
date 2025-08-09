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

    async function getAggregatedProgress(req: Request, res: Response) {
        const questId = Number(req.params.questId)
        try {
            const rows = await service.getAggregatedProgressForQuest(
                questId,
                (req as any).user?.id
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
                (req as any).user?.id
            )
            res.status(200).json(rows)
        } catch (err) {
            res.status(404).json({ message: (err as Error).message })
        }
    }

    return {
        createShare,
        listShares,
        deleteShare,
        getShareByToken,
        getProgress,
        setObserved,
        getAggregatedProgress,
        getQuestTaxaMappings,
    }
}

export type QuestShareController = ReturnType<typeof createQuestShareController>


