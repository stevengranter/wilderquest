import { Router } from 'express'
import iNaturalistAPIProxy from '../../proxies/iNaturalistAPI.proxy.js'
import pexelsAPIProxy from '../../proxies/pexelsAPI.proxy.js'
import { rateLimiter } from '../../middlewares/rateLimiter.js'

const iNatRouter = Router()

iNatRouter.get('/*splat', rateLimiter(1000, 20), iNaturalistAPIProxy)

const pexelsRouter = Router()

pexelsRouter.get('/', rateLimiter(1000, 1), pexelsAPIProxy)

export {
    iNatRouter as iNaturalistProxyRouter,
    pexelsRouter as pexelsProxyRouter,
}
