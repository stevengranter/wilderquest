import compression from 'compression'
import cors from 'cors'
import express from 'express'
import corsConfig from './config/cors.config.js'
import { createAuthController } from './controllers/authController.js'
import { createCollectionController } from './controllers/collectionController.js'
import { createINaturalistAPIController } from './controllers/iNaturalistAPIController.js'
import { createQuestController } from './controllers/questController.js'
import { createQuestShareController } from './controllers/questShareController.js'
import { createUserController } from './controllers/userController.js'
import { createUserService } from './services/userService.js'
import { rateLimiter } from './middlewares/rateLimiter.js'
import { rateSlowDown } from './middlewares/rateSlowDown.js'
import requestLogger from './middlewares/requestLogger.js'
import { CollectionRepository } from './repositories/CollectionRepository.js'
import {
    QuestRepository,
    QuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import type {
    QuestShareRepository,
    SharedQuestProgressRepository,
} from './repositories/QuestShareRepository.js'
import {
    mapTilesProxyRouter,
    wikipediaProxyRouter,
} from './routes/api/proxies.routes.js'
import { serviceRouter } from './routes/api/services.routes.js'
import { createAuthRouter } from './routes/authRouter.js'
import { createCollectionRouter } from './routes/collectionRouter.js'
import { createQuestEventsRouter } from './routes/questEventsRouter.js'
import { createQuestRouter } from './routes/questRouter.js'
import { createQuestShareRouter } from './routes/questShareRouter.js'
import { createUserRouter } from './routes/userRouter.js'
import { createAuthService } from './services/authService.js'
import { createQuestService } from './services/quests/questService.js'
import { createQuestShareService } from './services/quests/questShareService.js'
import { UserRepository } from './repositories/UserRepository.js'

export function buildApp({
    userRepository,
    collectionRepository,
    questRepository,
    questToTaxaRepository,
    questShareRepository,
    sharedQuestProgressRepository,
}: {
    userRepository: UserRepository
    collectionRepository: CollectionRepository
    questRepository: QuestRepository
    questToTaxaRepository: QuestToTaxaRepository
    questShareRepository: QuestShareRepository
    sharedQuestProgressRepository: SharedQuestProgressRepository
}) {
    // initialize express
    const app = express()

    // Enable gzip compression for all responses
    app.use(
        compression({
            level: 6, // Good balance between compression and speed
            threshold: 1024, // Only compress responses larger than 1KB
            filter: (req, res) => {
                // Don't compress EventSource responses
                if (req.headers.accept === 'text/event-stream') {
                    return false
                }
                // Don't compress responses with this request header
                if (req.headers['x-no-compression']) {
                    return false
                }
                // Use compression filter function
                return compression.filter(req, res)
            },
        })
    )

    app.use(express.json())
    app.use(requestLogger)

    // initialize main router
    const apiRouter = express.Router()

    const userService = createUserService(userRepository)
    const userController = createUserController(userService)
    const userRouter = createUserRouter(userController)
    apiRouter.use('/users', userRouter)

    const collectionController =
        createCollectionController(collectionRepository)
    const collectionRouter = createCollectionRouter(collectionController)
    apiRouter.use('/collections', collectionRouter)

    const questService = createQuestService(
        questRepository,
        questToTaxaRepository,
        questShareRepository,
        sharedQuestProgressRepository
    )
    const questController = createQuestController(questService)
    const questRouter = createQuestRouter(questController)
    apiRouter.use('/quests', questRouter)
    const questShareService = createQuestShareService(
        questRepository,
        questToTaxaRepository,
        questShareRepository,
        sharedQuestProgressRepository,
        userRepository
    )
    const questShareController = createQuestShareController(questShareService)
    const questShareRouter = createQuestShareRouter(questShareController)
    apiRouter.use('/quest-sharing', questShareRouter)
    const questEventsRouter = createQuestEventsRouter(
        questService,
        questShareService
    )
    apiRouter.use('/quests', questEventsRouter)

    const authService = createAuthService(userRepository)
    const authController = createAuthController(authService)
    const authRouter = createAuthRouter(authController)
    apiRouter.use('/auth', authRouter)

    const iNatController = createINaturalistAPIController()
    apiRouter.use(
        '/iNatAPI',
        rateSlowDown,
        // rateLimiter(60 * 1000, 120), // TEMPORARILY DISABLED for debugging
        iNatController
    )
    apiRouter.use('/tiles', mapTilesProxyRouter)
    apiRouter.use('/wikipedia', wikipediaProxyRouter)

    apiRouter.use('/service', serviceRouter)

    apiRouter.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: Date.now() })
    })

    apiRouter.use('/*splat', (req, res) => {
        res.status(404).json({ error: 'No such endpoint' })
    })

    app.use('/api', apiRouter)

    app.use(cors(corsConfig))
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    return app
}
