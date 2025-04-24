import {Router} from 'express'
import iNaturalistAPIProxy from '../proxies/iNaturalistAPI.proxy.js'

const router = Router()

router.get('/*splat', iNaturalistAPIProxy)

export {router as iNaturalistProxyRouter}
