// src/init.ts
import { initializeDb } from './db/index.js'
import UserRepository from './repositories/UserRepository.js'
import CollectionRepository from './repositories/CollectionRepository.js'

export async function initApp() {
    const dbPool = await initializeDb()
    const userRepository = new UserRepository('users', dbPool)
    const collectionRepository = new CollectionRepository('collections', dbPool)

    return {
        dbPool,
        userRepository,
        collectionRepository,
        // add more shared deps here (e.g., services, cache, etc.)
    }
}
