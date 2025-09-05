import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
    optionalAuthMiddleware,
    AuthenticatedRequest,
} from '../middlewares/verifyJWT.js'
import * as questEventsService from '../services/quests/questEventsService.js'
import { QuestService } from '../services/quests/questService.js'
import type { QuestShareService } from '../services/quests/questShareService.js'

export function createQuestEventsRouter(
    questService: QuestService,
    questShareService: QuestShareService
) {
    const router = Router()

    router.get(
        '/:questId/events',
        optionalAuthMiddleware,
        async (req: AuthenticatedRequest, res) => {
            const questId = Number(req.params.questId)
            const userId = req.user?.id
            const token = req.query.token as string

            console.log(
                '🔌 SERVER: EventSource connection request for quest:',
                questId
            )
            console.log('🔌 SERVER: Request headers:', req.headers)
            console.log('🔌 SERVER: Request method:', req.method)
            console.log('🔌 SERVER: Request URL:', req.url)
            console.log('🔌 SERVER: User authenticated:', !!req.user)
            console.log('🔌 SERVER: User ID:', userId)
            console.log('🔌 SERVER: Token provided:', !!token)

            try {
                // Check access based on authentication method
                if (userId) {
                    // Authenticated user - check ownership or public access
                    await questService.getAccessibleQuestById(questId, userId)
                    console.log(
                        '🔌 SERVER: Access check passed for authenticated user:',
                        userId
                    )
                } else if (token) {
                    // Try guest access via share token first
                    try {
                        await questShareService.getShareDetailsByToken(token)
                        console.log(
                            '🔌 SERVER: Access check passed for share token'
                        )
                    } catch (_shareError) {
                        // If share token validation fails, try access token validation
                        console.log(
                            '🔌 SERVER: Share token validation failed, trying access token'
                        )
                        try {
                            const decoded = jwt.verify(
                                token,
                                process.env.ACCESS_TOKEN_SECRET!
                            ) as jwt.JwtPayload
                            if (decoded && decoded.id) {
                                await questService.getAccessibleQuestById(
                                    questId,
                                    decoded.id
                                )
                                console.log(
                                    '🔌 SERVER: Access check passed for access token, user:',
                                    decoded.id
                                )
                            } else {
                                throw new Error('Invalid access token')
                            }
                        } catch (_accessError) {
                            console.error(
                                '🔌 SERVER: Both share token and access token validation failed'
                            )
                            throw new Error('Invalid authentication token')
                        }
                    }
                } else {
                    throw new Error('No authentication provided')
                }

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
