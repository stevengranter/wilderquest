// src/init.ts
import { initializeDb } from './db/index.js'
import { createCollectionRepository } from './repositories/CollectionRepository.js'
import {
    createQuestRepository,
    createQuestToTaxaRepository,
} from './repositories/QuestRepository.js'
import { createUserRepository } from './repositories/UserRepository.js'
import { getTableColumns } from './utils/getTableColumns.js'

// Initialize db and repositories
export async function initApp() {
    const dbPool = await initializeDb()

    const userColumns = await getTableColumns(dbPool, 'users')
    const userRepository = createUserRepository('users', dbPool, userColumns)

    const collectionColumns = await getTableColumns(dbPool, 'collections')
    const collectionRepository = createCollectionRepository(
        'collections',
        dbPool,
        collectionColumns
    )

    const questToTaxaColumns = await getTableColumns(dbPool, 'quests_to_taxa')
    const questToTaxaRepository = createQuestToTaxaRepository(
        'quests_to_taxa',
        dbPool,
        questToTaxaColumns
    )
    const questTableColumns = await getTableColumns(dbPool, 'quests')
    const questRepository = createQuestRepository(
        'quests',
        dbPool,
        questTableColumns,
        questToTaxaRepository
    )

    return {
        dbPool,
        userRepository,
        collectionRepository,
        questRepository,
        questToTaxaRepository,
    }
}
