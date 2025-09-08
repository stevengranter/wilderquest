import { Router } from 'express'
import jwt from 'jsonwebtoken'
import {
    optionalAuthMiddleware,
    AuthenticatedRequest,
} from '../middlewares/verifyJWT.js'
import * as questEventsService from '../services/questEventsService.js'
import { QuestService } from '../services/questService.js'
import type { QuestShareService } from '../services/questShareService.js'
import { serverDebug } from '../../shared/utils/debug.js'

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

            serverDebug.events(
                'EventSource connection request for quest: %s',
                questId
            )
            serverDebug.events('Request headers: %o', req.headers)
            serverDebug.events('Request method: %s', req.method)
            serverDebug.events('Request URL: %s', req.url)
            serverDebug.events('User authenticated: %s', !!req.user)
            serverDebug.events('User ID: %s', userId)
            serverDebug.events('Token provided: %s', !!token)

            try {
                // Check access based on authentication method
                if (userId) {
                    // Authenticated user - check ownership or public access
                    await questService.getAccessibleQuestById(questId, userId)
                    serverDebug.events(
                        'Access check passed for authenticated user: %s',
                        userId
                    )
                } else if (token) {
                    // Try guest access via share token first
                    try {
                        await questShareService.getShareDetailsByToken(token)
                        serverDebug.events(
                            'Access check passed for share token'
                        )
                    } catch (_shareError) {
                        // If share token validation fails, try access token validation
                        serverDebug.events(
                            'Share token validation failed, trying access token'
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
                                serverDebug.events(
                                    'Access check passed for access token, user: %s',
                                    decoded.id
                                )
                            } else {
                                throw new Error('Invalid access token')
                            }
                        } catch (_accessError) {
                            serverDebug.events(
                                'Both share token and access token validation failed'
                            )
                            throw new Error('Invalid authentication token')
                        }
                    }
                } else {
                    throw new Error('No authentication provided')
                }

                questEventsService.subscribe(req, res)
                serverDebug.events('subscribe function called successfully')
            } catch (error) {
                serverDebug.events('Access denied or error: %o', error)
                if (!res.headersSent) {
                    res.status(403).json({ error: 'Access denied' })
                }
            }
        }
    )

    return router
}
