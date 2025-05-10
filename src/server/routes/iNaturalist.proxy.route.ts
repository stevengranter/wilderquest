import { Router } from 'express'
import iNaturalistAPIProxy from '../proxies/iNaturalistAPI.proxy.js'
import pexelsAPIProxy from '../proxies/pexelsAPI.proxy.js'

const iNatRouter = Router()

iNatRouter.get('/*splat', iNaturalistAPIProxy)

const pexelsRouter = Router()

pexelsRouter.get('/', pexelsAPIProxy)

export {
    iNatRouter as iNaturalistProxyRouter,
    pexelsRouter as pexelsProxyRouter,
}
