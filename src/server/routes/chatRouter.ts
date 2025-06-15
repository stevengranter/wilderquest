import { Router } from 'express'
import type { ChatController } from '../controllers/chatController.js'

export function chatRouter(controller: ChatController) {
    const router = Router()
    router.post('/', controller.handleChatRequest)
    return router
}
