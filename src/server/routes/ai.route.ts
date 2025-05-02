import { Router } from 'express'
import aiController from '../controllers/ai.controller.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Hello, welcome to AI endpoint!' })
})

router.post('/identify', aiController.identifySubject)

export { router as aiRouter }
