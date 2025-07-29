// src/init.ts
import { initializeDb } from './db/index.js'
import CollectionRepository from './repositories/CollectionRepository.js'
import QuestRepository, {
    QuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import UserRepository from './repositories/UserRepository.js'
import AuthService from './services/authService.js'
import { QuestService } from './services/QuestService.js'

export async function initApp() {
    const dbPool = await initializeDb()
    const userRepository = new UserRepository('users', dbPool)
    const collectionRepository = new CollectionRepository('collections', dbPool)
    const questRepository = new QuestRepository('quests', dbPool)
    const questToTaxaRepository = new QuestToTaxaRepository(
        'quests_to_taxa',
        dbPool
    )
    const questService = new QuestService(
        questRepository,
        questToTaxaRepository
    )
    const authService = new AuthService(userRepository)
    return {
        dbPool,
        userRepository,
        collectionRepository,
        questRepository,
        questToTaxaRepository,
        questService,
        authService,
        // add more shared deps here (e.g., services, cache, etc.)
    }
}
