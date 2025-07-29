import cors from 'cors'
import express from 'express'
import corsConfig from './config/cors.config.js'
import { createAuthController } from './controllers/authController.js'
import { createChatController } from './controllers/chatController.js'
import { createCollectionController } from './controllers/collectionController.js'
import { createINaturalistAPIController } from './controllers/iNaturalistAPIController.js'
import { createQuestController } from './controllers/questController.js'
import { createUserController } from './controllers/userController.js'
import { rateLimiter } from './middlewares/rateLimiter.js'
import { rateSlowDown } from './middlewares/rateSlowDown.js'
import { CollectionRepositoryInstance } from './repositories/CollectionRepository.js'
import {
    QuestRepositoryInstance,
    QuestToTaxaRepositoryInstance,
} from './repositories/QuestRepository.js'
import { type UserRepositoryInstance } from './repositories/UserRepository.js'
import { mapTilesProxyRouter } from './routes/api/proxies.routes.js'
import { serviceRouter } from './routes/api/services.routes.js'
import { authRouter } from './routes/authRouter.js'
import { chatRouter } from './routes/chatRouter.js'
import { collectionRouter } from './routes/collectionRouter.js'
import { questRouter } from './routes/questRouter.js'
import { userRouter } from './routes/userRouter.js'
import { AuthServiceInstance } from './services/authService.js'
import { QuestServiceInstance } from './services/QuestService.js'

export function buildApp({
    userRepository,
    collectionRepository,
    questRepository,
    questToTaxaRepository,
    questService,
    authService,
}: {
    userRepository: UserRepositoryInstance
    collectionRepository: CollectionRepositoryInstance
    questRepository: QuestRepositoryInstance
    questToTaxaRepository: QuestToTaxaRepositoryInstance
    questService: QuestServiceInstance
    authService: AuthServiceInstance
}) {
    const app = express()
    app.use(express.json())

    const apiRouter = express.Router()

    const userController = createUserController(userRepository)
    apiRouter.use('/users', userRouter(userController))

    const collectionController =
        createCollectionController(collectionRepository)
    apiRouter.use('/collections', collectionRouter(collectionController))

    const questController = createQuestController(questService)
    apiRouter.use('/quests', questRouter(questController))

    const authController = createAuthController(authService)
    apiRouter.use('/auth', authRouter(authController))

    const chatController = createChatController()
    apiRouter.use('/chat', chatRouter(chatController))

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
