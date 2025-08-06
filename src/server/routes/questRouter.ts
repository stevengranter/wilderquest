import { Router } from 'express'
import { QuestController } from '../controllers/questController.js'
import verifyJWT, { optionalAuthMiddleware } from '../middlewares/verifyJWT.js'

export function createQuestRouter(controller: QuestController) {
    const router = Router()
    router.get('/', controller.getQuests)
    router.get('/:id', optionalAuthMiddleware, controller.getQuestById)
    router.get(
        '/user/:user_id',
        optionalAuthMiddleware,
        controller.getQuestsByUserId
    )
    router.post('/', verifyJWT, controller.createQuest)
    return router
}
