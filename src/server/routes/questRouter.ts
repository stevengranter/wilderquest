import { Router } from 'express'
import { QuestController } from '../controllers/questController.js'
import verifyJWT from '../middlewares/verifyJWT.js'

export function questRouter(controller: QuestController) {
    const router = Router()
    router.get('/', controller.getQuests)
    router.get('/:id', verifyJWT, controller.getQuestById)
    return router
}
