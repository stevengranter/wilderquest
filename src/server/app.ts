import cors from 'cors'
import express from 'express'
import corsConfig from './config/cors.config.js'
import { createAuthController } from './controllers/authController.js'
import { createCollectionController } from './controllers/collectionController.js'
import { createINaturalistAPIController } from './controllers/iNaturalistAPIController.js'
import { createQuestController } from './controllers/questController.js'
import { createQuestShareController } from './controllers/questShareController.js'
import { createUserController } from './controllers/userController.js'
import { rateLimiter } from './middlewares/rateLimiter.js'
import { rateSlowDown } from './middlewares/rateSlowDown.js'
import { CollectionRepository } from './repositories/CollectionRepository.js'
import {
    QuestRepository,
    QuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import type {
    QuestShareRepository,
    SharedQuestProgressRepository,
} from './repositories/QuestShareRepository.js'
import { type UserRepository } from './repositories/UserRepository.js'
import { mapTilesProxyRouter } from './routes/api/proxies.routes.js'
import { serviceRouter } from './routes/api/services.routes.js'
import { createAuthRouter } from './routes/authRouter.js'
import { createCollectionRouter } from './routes/collectionRouter.js'
import questEventsRouter from './routes/questEventsRouter.js'
import { createQuestRouter } from './routes/questRouter.js'
import { createQuestShareRouter } from './routes/questShareRouter.js'
import { userRouter } from './routes/userRouter.js'
import { createAuthService } from './services/authService.js'
import { createQuestService } from './services/questService.js'
import { createQuestShareService } from './services/questShareService.js'
import { createUserService } from './services/userService.js'

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
    app.use(express.json())

    // initialize main router
    const apiRouter = express.Router()

    // TODO: create userService
    const userService = createUserService(userRepository)
    const userController = createUserController(userService)
    apiRouter.use('/users', userRouter(userController))

    const collectionController =
        createCollectionController(collectionRepository)
    const collectionRouter = createCollectionRouter(collectionController)
    apiRouter.use('/collections', collectionRouter)
    // apiRouter.use('/collections', createCollectionRouter(collectionController))

    const questService = createQuestService(
        questRepository,
        questToTaxaRepository,
        questShareRepository
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
    apiRouter.use('/quests', questEventsRouter)

    // apiRouter.use('/quests', createQuestRouter(questController))

    const authService = createAuthService(userRepository)
    const authController = createAuthController(authService)
    const authRouter = createAuthRouter(authController)
    apiRouter.use('/auth', authRouter)

    // const chatController = createChatController()
    // apiRouter.use('/chat', chatRouter(chatController))

    const iNatController = createINaturalistAPIController()
    // More conservative rate limiting to prevent 429 errors
    // iNaturalist recommends staying under 60 requests/minute
    apiRouter.use(
        '/iNatAPI',
        rateSlowDown,
        rateLimiter(60 * 1000, 30), // Reduced from 60 to 30 requests per minute
        iNatController
    )
    apiRouter.use('/tiles', mapTilesProxyRouter)

    apiRouter.use('/service', serviceRouter)

    apiRouter.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: Date.now() })
    })

    apiRouter.use('/*splat', (req, res) => {
        res.status(404).json({ error: 'No such endpoint' })
    })

    // Mount /api
    app.use('/api', apiRouter)

    // 📎 Middleware
    app.use(cors(corsConfig))
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    // app.use('/api', apiRouter)

    return app
}
