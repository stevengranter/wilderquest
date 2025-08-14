import { Router } from 'express'
import type { QuestShareController } from '../controllers/questShareController.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function createQuestShareRouter(controller: QuestShareController) {
    const router = Router()

    // Owner endpoints (auth required)
    router.post('/quests/:questId/shares', verifyJWT, controller.createShare)
    router.get('/quests/:questId/shares', verifyJWT, controller.listShares)
    router.delete('/shares/:shareId', verifyJWT, controller.deleteShare)
    router.post(
        '/quests/:questId/progress/:mappingId',
        verifyJWT,
        controller.setObservedAsOwner
    )
    router.delete(
        '/quests/:questId/progress/:progressId',
        verifyJWT,
        controller.deleteProgress
    )
    router.post(
        '/quests/:questId/progress/:mappingId/clear',
        verifyJWT,
        controller.clearMapping
    )

    // Public endpoints via token (no auth)
    router.get(
        '/shares/token/:token',
        optionalAuthMiddleware,
        controller.getShareByToken
    )
    router.get(
        '/shares/token/:token/progress',
        optionalAuthMiddleware,
        controller.getProgress
    )
    router.get(
        '/shares/token/:token/progress/aggregate',
        optionalAuthMiddleware,
        controller.getAggregatedProgressByToken
    )
    router.post(
        '/shares/token/:token/progress/:mappingId',
        optionalAuthMiddleware,
        controller.setObserved
    )

    // Aggregated progress, leaderboard, and mappings for a quest (public for public quests, or owner if private)
    router.get(
        '/quests/:questId/mappings',
        optionalAuthMiddleware,
        controller.getQuestTaxaMappings
    )
    router.get(
        '/quests/:questId/progress/aggregate',
        optionalAuthMiddleware,
        controller.getAggregatedProgress
    )
    router.get(
        '/quests/:questId/progress/leaderboard',
        optionalAuthMiddleware,
        controller.getLeaderboard
    ) //
    router.get(
        '/quests/:questId/progress/detailed',
        optionalAuthMiddleware,
        controller.getDetailedProgress
    )

    return router
}
