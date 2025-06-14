import { Router } from 'express'
import chatController from '../../controllers/chat.controller.js'


const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Chat endpoint' })
})

router.post('/', chatController)


export { router as chatRouter }
