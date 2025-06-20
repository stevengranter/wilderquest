// src/init.ts
import { initializeDb } from './db/index.js'
import UserRepository from './repositories/UserRepository.js'
import CollectionRepository from './repositories/CollectionRepository.js'
import AuthService from './services/authService.js'
import { CollectionService } from './services/CollectionService.js'

export async function initApp() {
    const dbPool = await initializeDb()
    const userRepository = new UserRepository('users', dbPool)
    const collectionRepository = new CollectionRepository('collections', dbPool)
    const authService = new AuthService(userRepository)
    return {
        dbPool,
        userRepository,
        collectionRepository,
        authService,
        // add more shared deps here (e.g., services, cache, etc.)
    }
}
