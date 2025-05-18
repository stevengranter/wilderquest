import { Router } from 'express'
import { getGeoCodeForward, getGeoCodeReverse } from '../../2_controllers/services.controller.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Endpoints available: geo/forward' })
})

router.get('/geo/forward', getGeoCodeForward)
router.get('/geo/reverse', getGeoCodeReverse)

export { router as serviceRouter }
