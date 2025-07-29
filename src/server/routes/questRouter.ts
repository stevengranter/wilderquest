import { Router } from 'express'
import { QuestController } from '../controllers/questController.js'

export function questRouter(controller: QuestController) {
    const router = Router()
    router.get('/', async (req, res) => {
        const quests = await controller.getQuests()
        console.log(quests)
        res.status(200).send(quests)
    })
    router.get('/:id', async (req, res) => {
        const quest = await controller.getQuestById(Number(req.params.id))
        res.status(200).send(quest)
    })
    return router
}
