import { Router } from 'express'
import { getGeoCodeForward } from '../../2_controllers/services.controller.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Endpoints available: geo/forward' })
})

router.get('/geo/forward', getGeoCodeForward)

export { router as serviceRouter }
