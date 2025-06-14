import express from 'express'
import { createUserController } from './controllers/userController.js'
import { userRoutes } from './routes/userRoutes.js'
import { collectionRoutes } from './routes/collectionRoutes.js'
import cors from 'cors'
import corsConfig from './config/cors.config.js'
import { type UserRepositoryInstance } from './repositories/UserRepository.js'
import { type CollectionRepositoryInstance } from './repositories/CollectionRepository.js'
import { createCollectionController } from './controllers/collectionController.js'
import { createRefreshTokenController } from './controllers/refreshTokenController.js'
import { createAuthController } from './controllers/authController.js'
import { authRoutes } from './routes/authRoutes.js'

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
    app.use('/users', userRoutes(userController))

    const collectionController = createCollectionController(collectionRepository)
    app.use('/collections', collectionRoutes(collectionController))

    const refreshTokenController = createRefreshTokenController(userRepository)
    const authController = {
        ...createAuthController({ userRepository }),
        ...refreshTokenController,
    }
    app.use('/auth', authRoutes(authController))

    // 📎 Middleware
    app.use(cors(corsConfig))
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    // app.use('/api', apiRouter)

    return app
}
