import { Router } from 'express'
import { rateLimiter } from '../../middlewares/rateLimiter.js'
import iNaturalistAPIProxy from '../../proxies/iNaturalistAPI.proxy.js'
import mapTilesProxy from '../../proxies/maptilesAPI.proxy.js'
import pexelsAPIProxy from '../../proxies/pexelsAPI.proxy.js'

const iNatRouter = Router()

iNatRouter.get('/*splat', rateLimiter(1000, 60), iNaturalistAPIProxy)

const pexelsRouter = Router()

pexelsRouter.get('/', rateLimiter(1000, 1), pexelsAPIProxy)

const mapTilesRouter = Router()

mapTilesRouter.get('/{*splat}', mapTilesProxy)

export {
    iNatRouter as iNaturalistProxyRouter,
    pexelsRouter as pexelsProxyRouter,
    mapTilesRouter as mapTilesProxyRouter,
}
