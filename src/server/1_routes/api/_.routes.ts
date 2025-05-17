import { Router } from 'express'
import { usersRouter } from './users.routes.js'
import { authRouter } from './auth.routes.js'
import { refreshTokenRouter } from './refresh.routes.js'
import { collectionsRouter } from './collections.routes.js'
import { searchRouter } from './search.routes.js'
import {
    iNaturalistProxyRouter,
    pexelsProxyRouter,
} from '../iNaturalist.proxy.routes.js'
import { serviceRouter } from './services.routes.js'

const router = Router()

// Route config
const routes = [
    // { url: "/", router: rootRouter },
    { url: '/users', router: usersRouter },
    { url: '/auth', router: authRouter },
    { url: '/refresh', router: refreshTokenRouter },
    { url: '/collections', router: collectionsRouter },
    { url: '/iNatAPI', router: iNaturalistProxyRouter },
    { url: '/proxy/pexels', router: pexelsProxyRouter },
    { url: '/search', router: searchRouter },
    { url: '/service', router: serviceRouter },
]

routes.forEach((route) => {
    router.use(route.url, route.router)
})

export { router as apiRouter }
