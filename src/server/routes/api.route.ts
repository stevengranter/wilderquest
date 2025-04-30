import { Router } from 'express'
import { usersRouter } from './users.route.js'
import { authRouter } from './auth.route.js'
import { refreshTokenRouter } from './refresh.route.js'
import { collectionsRouter } from './collections.routes.js'
import { iNaturalistProxyRouter } from './iNaturalist.proxy.route.js'
import { aiRouter } from './ai.route.js'

const router = Router()

// Route config
const routes = [
    // { url: "/", router: rootRouter },
    { url: '/users', router: usersRouter },
    { url: '/auth', router: authRouter },
    { url: '/refresh', router: refreshTokenRouter },
    { url: '/collections', router: collectionsRouter },
    { url: '/iNatAPI', router: iNaturalistProxyRouter },
    { url: '/ai', router: aiRouter },
]

routes.forEach((route) => {
    router.use(route.url, route.router)
})

export { router as apiRouter }
