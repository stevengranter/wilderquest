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

export function buildApp(
    {
        userRepository,
        collectionRepository,
    }:
    {
        userRepository: UserRepositoryInstance,
        collectionRepository: CollectionRepositoryInstance
    }) {
    const app = express()
    app.use(express.json())

    const userController = createUserController(userRepository)
    app.use('/users', userRouter(userController))

    const collectionController = createCollectionController(collectionRepository)
    app.use('/collections', collectionRouter(collectionController))

    const authController = createAuthController(userRepository)
    app.use('/auth', authRouter(authController))

    const chatController = createChatController()
    app.use('/chat', chatRouter(chatController))

    // 📎 Middleware
    app.use(cors(corsConfig))
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    // app.use('/api', apiRouter)

    return app
}
