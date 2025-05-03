import { Router } from 'express'
import { usersRouter } from './users/users.route.js'
import { authRouter } from './auth/auth.routes.js'
import { refreshTokenRouter } from './refresh/refresh.route.js'
import { collectionsRouter } from './collections/collections.routes.js'
import { searchRouter } from './search/search.routes.js'
import { iNaturalistProxyRouter } from '../iNaturalist.proxy.route.js'

const router = Router()

// Route config
const routes = [
    // { url: "/", router: rootRouter },
    { url: '/users', router: usersRouter },
    { url: '/auth', router: authRouter },
    { url: '/refresh', router: refreshTokenRouter },
    { url: '/collections', router: collectionsRouter },
    { url: '/iNatAPI', router: iNaturalistProxyRouter },
    { url: '/search', router: searchRouter },
]

routes.forEach((route) => {
    router.use(route.url, route.router)
})

export { router as apiRouter }
