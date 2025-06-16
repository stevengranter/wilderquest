import express from 'express'

import cors from 'cors'
import corsConfig from './config/cors.config.js'

import { authRouter } from './routes/authRouter.js'
import { userRouter } from './routes/userRouter.js'
import { collectionRouter } from './routes/collectionRouter.js'

import { createCollectionController } from './controllers/collectionController.js'
import { createAuthController } from './controllers/authController.js'
import { createUserController } from './controllers/userController.js'

import { type UserRepositoryInstance } from './repositories/UserRepository.js'
import { type CollectionRepositoryInstance } from './repositories/CollectionRepository.js'
import { createChatController } from './controllers/chatController.js'
import { chatRouter } from './routes/chatRouter.js'
import { createINaturalistAPIController } from './controllers/iNaturalistAPIController.js'

export function buildApp(
    {
        userRepository,
        collectionRepository,
        authService,
    }:
    {
        userRepository: UserRepositoryInstance,
        collectionRepository: CollectionRepositoryInstance
        authService: AuthServiceInstance

    }) {
    const app = express()
    app.use(express.json())

    const apiRouter = express.Router()

    const userController = createUserController(userRepository)
    apiRouter.use('/users', userRouter(userController))

    const collectionController = createCollectionController(collectionRepository)
    apiRouter.use('/collections', collectionRouter(collectionController))


    const authController = createAuthController(authService)
    apiRouter.use('/auth', authRouter(authController))

    const chatController = createChatController()
    apiRouter.use('/chat', chatRouter(chatController))

    const iNatController = createINaturalistAPIController()
    apiRouter.use('/iNatAPI', iNatController)

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
