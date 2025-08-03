import cors from 'cors'
import express from 'express'
import corsConfig from './config/cors.config.js'
import { createAuthController } from './controllers/authController.js'
import { createCollectionController } from './controllers/collectionController.js'
import { createINaturalistAPIController } from './controllers/iNaturalistAPIController.js'
import { createQuestController } from './controllers/questController.js'
import { createUserController } from './controllers/userController.js'
import { rateLimiter } from './middlewares/rateLimiter.js'
import { rateSlowDown } from './middlewares/rateSlowDown.js'
import { CollectionRepository } from './repositories/CollectionRepository.js'
import {
    QuestRepository,
    QuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import { type UserRepository } from './repositories/UserRepository.js'
import { mapTilesProxyRouter } from './routes/api/proxies.routes.js'
import { serviceRouter } from './routes/api/services.routes.js'
import { createAuthRouter } from './routes/authRouter.js'
import { createCollectionRouter } from './routes/collectionRouter.js'
import { createQuestRouter } from './routes/questRouter.js'
import { userRouter } from './routes/userRouter.js'
import { createAuthService } from './services/authService.js'
import { createQuestService } from './services/questService.js'

export function buildApp({
    userRepository,
    collectionRepository,
    questRepository,
    questToTaxaRepository,
}: {
    userRepository: UserRepository
    collectionRepository: CollectionRepository
    questRepository: QuestRepository
    questToTaxaRepository: QuestToTaxaRepository
}) {
    // initialize express
    const app = express()
    app.use(express.json())

    // initialize main router
    const apiRouter = express.Router()

    // TODO: create userService
    const userController = createUserController(userRepository)
    apiRouter.use('/users', userRouter(userController))

    const collectionController =
        createCollectionController(collectionRepository)
    const collectionRouter = createCollectionRouter(collectionController)
    apiRouter.use('/collections', collectionRouter)
    // apiRouter.use('/collections', createCollectionRouter(collectionController))

    const questService = createQuestService(
        questRepository,
        questToTaxaRepository
    )
    const questController = createQuestController(questService)
    const questRouter = createQuestRouter(questController)
    apiRouter.use('/quests', questRouter)
    // apiRouter.use('/quests', createQuestRouter(questController))

    const authService = createAuthService(userRepository)
    const authController = createAuthController(authService)
    const authRouter = createAuthRouter(authController)
    apiRouter.use('/auth', authRouter)

    // const chatController = createChatController()
    // apiRouter.use('/chat', chatRouter(chatController))

    const iNatController = createINaturalistAPIController()
    // apiRouter.use('/iNatAPI', rateLimiter(1000, 1), iNatController)
    apiRouter.use(
        '/iNatAPI',
        rateSlowDown,
        rateLimiter(60 * 1000, 60),
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
