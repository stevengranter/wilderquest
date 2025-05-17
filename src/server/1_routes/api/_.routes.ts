import { Router } from 'express'
import { usersRouter } from './users/users.route.js'
import { authRouter } from './auth/auth.routes.js'
import { refreshTokenRouter } from './refresh/refresh.route.js'
import { collectionsRouter } from './collections/collections.routes.js'
import { searchRouter } from './search/search.routes.js'
import {
    iNaturalistProxyRouter,
    pexelsProxyRouter,
} from '../iNaturalist.proxy.route.js'
import { serviceRouter } from './services/services.routes.js'

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
