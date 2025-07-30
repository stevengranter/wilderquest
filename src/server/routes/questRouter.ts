import { Router } from 'express'
import { QuestController } from '../controllers/questController.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function questRouter(controller: QuestController) {
    const router = Router()
    router.get('/', controller.getQuests)
    router.get('/:id', verifyJWT, controller.getQuestById)
    router.get('/user/:user_id', optionalAuthMiddleware, controller.getQuestsByUserId)
    return router
}
