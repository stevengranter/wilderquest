import { Router } from 'express'
import aiController from '../controllers/ai.controller.js'
import taxabindDemoAPIProxy from '../proxies/taxabindDemoApi.proxy.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Hello, welcome to AI endpoint!' })
})

router.get('/hello', aiController.sayHello)

router.post('/identify', aiController.identifySubject)

router.post('/identifyTaxa', taxabindDemoAPIProxy)

// router.get('/*params', aiController.getParams)

export { router as aiRouter }
