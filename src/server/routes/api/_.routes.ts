// import { Router } from 'express'
// import { userRouter } from '../userRouter.js'
// import { authRoute } from '../authRoute.js'
// import { refreshTokenRouter } from './refresh.routes.js'
// import { collectionRouter } from '../collectionRouter.js'
// import { searchRouter } from './search.routes.js'
// import {
//     iNaturalistProxyRouter,
//     pexelsProxyRouter,
// } from './proxies.routes.js'
// import { serviceRouter } from './services.routes.js'
// import { chatRouter } from './chat.routes.js'
//
// const router = Router()
//
// // Route config
// const routes = [
//     // { url: "/", router: rootRouter },
//     { url: '/users', router: userRouter },
//     { url: '/auth', router: authRoute },
//     { url: '/refresh', router: refreshTokenRouter },
//     { url: '/collections', router: collectionRouter },
//     { url: '/iNatAPI', router: iNaturalistProxyRouter },
//     { url: '/proxy/pexels', router: pexelsProxyRouter },
//     { url: '/search', router: searchRouter },
//     { url: '/service', router: serviceRouter },
//     { url: '/chat', router: chatRouter },
// ]
//
// routes.forEach((route) => {
//     router.use(route.url, route.router)
// })
//
// export { router as apiRouter }
