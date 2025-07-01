import { Router } from 'express'
import { rateLimiter } from '../../middlewares/rateLimiter.js'
import mapTilesProxy from '../../proxies/maptilesAPI.proxy.js'
import pexelsAPIProxy from '../../proxies/pexelsAPI.proxy.js'

const pexelsRouter = Router()

pexelsRouter.get('/', rateLimiter(1000, 1), pexelsAPIProxy)

const mapTilesRouter = Router()

mapTilesRouter.get('/{*splat}', mapTilesProxy)

export {
    pexelsRouter as pexelsProxyRouter,
    mapTilesRouter as mapTilesProxyRouter,
}
