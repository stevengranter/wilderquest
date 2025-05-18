import { Router } from 'express'
import iNaturalistAPIProxy from '../../4_proxies/iNaturalistAPI.proxy.js'
import pexelsAPIProxy from '../../4_proxies/pexelsAPI.proxy.js'
import { rateLimiter } from '../../_middleware/rateLimiter.js'

const iNatRouter = Router()

iNatRouter.get('/*splat', rateLimiter(1000, 20), iNaturalistAPIProxy)

const pexelsRouter = Router()

pexelsRouter.get('/', rateLimiter(1000, 1), pexelsAPIProxy)

export {
    iNatRouter as iNaturalistProxyRouter,
    pexelsRouter as pexelsProxyRouter,
}
