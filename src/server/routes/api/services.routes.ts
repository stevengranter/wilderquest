import { Router } from 'express'
import {
    getGeoCodeForward,
    getGeoCodeReverse,
    getCombinedLocationSearch,
    getNearbyLocations,
} from '../../controllers/services.controller.js'
import { rateLimiter } from '../../middlewares/rateLimiter.js'

const router = Router()

router.get('/', (req, res) => {
    res.status(200).send({ message: 'Endpoints available: geo/forward' })
})

router.get('/geo/forward', rateLimiter(1000, 2), getGeoCodeForward)
router.get('/geo/reverse', rateLimiter(1000, 2), getGeoCodeReverse)
router.get(
    '/geo/combined-search',
    rateLimiter(1000, 2),
    getCombinedLocationSearch
)
router.get('/geo/nearby', rateLimiter(1000, 2), getNearbyLocations)

export { router as serviceRouter }
