import { Router } from 'express'
import {
    optionalAuthMiddleware,
    AuthenticatedRequest,
} from '../middlewares/verifyJWT.js'
import * as questEventsService from '../services/quests/questEventsService.js'
import { QuestService } from '../services/quests/questService.js'

export function createQuestEventsRouter(questService: QuestService) {
    const router = Router()

    router.get(
        '/:questId/events',
        optionalAuthMiddleware,
        async (req: AuthenticatedRequest, res) => {
            const questId = Number(req.params.questId)
            const userId = req.user?.id

            console.log(
                '🔌 SERVER: EventSource connection request for quest:',
                questId
            )
            console.log('🔌 SERVER: Request headers:', req.headers)
            console.log('🔌 SERVER: Request method:', req.method)
            console.log('🔌 SERVER: Request URL:', req.url)
            console.log('🔌 SERVER: User authenticated:', !!req.user)
            console.log('🔌 SERVER: User ID:', userId)

            try {
                // Check if user has access to this quest
                await questService.getAccessibleQuestById(questId, userId)
                console.log(
                    '🔌 SERVER: Access check passed for quest:',
                    questId
                )

                questEventsService.subscribe(req, res)
                console.log('🔌 SERVER: subscribe function called successfully')
            } catch (error) {
                console.error('🔌 SERVER: Access denied or error:', error)
                if (!res.headersSent) {
                    res.status(403).json({ error: 'Access denied' })
                }
            }
        }
    )

    return router
}
