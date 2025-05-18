import { Router } from 'express'
import { getGeoCodeForward, getGeoCodeReverse } from '../../2_controllers/services.controller.js'
import { rateLimiter } from '../../_middleware/rateLimiter.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Endpoints available: geo/forward' })
})

router.get('/geo/forward', rateLimiter(1000, 2), getGeoCodeForward)
router.get('/geo/reverse', rateLimiter(1000, 2), getGeoCodeReverse)

export { router as serviceRouter }
