// src/init.ts
import { initializeDb } from './db/index.js'
import { createCollectionRepository } from './repositories/CollectionRepository.js'
import {
    createQuestRepository,
    createQuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import { createUserRepository } from './repositories/UserRepository.js'

// Initialize db and repositories
export async function initApp() {
    const dbPool = await initializeDb()
    const userRepository = createUserRepository('users', dbPool)
    const collectionRepository = createCollectionRepository(
        'collections',
        dbPool
    )
    const questRepository = createQuestRepository('quests', dbPool)
    const questToTaxaRepository = createQuestToTaxaRepository(
        'quests_to_taxa',
        dbPool
    )

    return {
        dbPool,
        userRepository,
        collectionRepository,
        questRepository,
        questToTaxaRepository,
    }
}
