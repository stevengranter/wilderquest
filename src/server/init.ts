// src/init.ts
import { initializeDb } from './config/db.js'
import {
    createCollectionRepository,
    createQuestRepository,
    createQuestShareRepository,
    createQuestToTaxaRepository,
    createSharedQuestProgressRepository,
    createUserRepository,
} from './repositories/index.js'
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

    // Quest shares + progress
    const questShareColumns = await getTableColumns(dbPool, 'quest_shares')
    const questShareRepository = createQuestShareRepository(
        'quest_shares',
        dbPool,
        questShareColumns
    )
    const progressColumns = await getTableColumns(
        dbPool,
        'shared_quest_progress'
    )
    const sharedQuestProgressRepository = createSharedQuestProgressRepository(
        'shared_quest_progress',
        dbPool,
        progressColumns
    )

    return {
        dbPool,
        userRepository,
        collectionRepository,
        questRepository,
        questToTaxaRepository,
        questShareRepository,
        sharedQuestProgressRepository,
    }
}
