import { Pool } from 'mysql2/promise'
import BaseRepository from './BaseRepository.js'

type Quest = {
    id: number
    name: string
    description?: string
    is_private: boolean
}

type QuestToTaxa = {
    id: number
    quest_id: number
    taxon_id: number
}

export type QuestRepositoryInstance = InstanceType<typeof QuestRepository>

export default class QuestRepository extends BaseRepository<Quest> {
    constructor(tableName: string, dbPool: Pool) {
        super(tableName, dbPool)
        console.log(
            `QuestRepository constructed for table '${tableName}' with dbPool:`,
            dbPool ? 'exists' : 'does not exist'
        )
    }
}

export type QuestToTaxaRepositoryInstance = InstanceType<
    typeof QuestToTaxaRepository
>
export class QuestToTaxaRepository extends BaseRepository<QuestToTaxa> {
    constructor(tableName: string, dbPool: Pool) {
        super(tableName, dbPool)
        console.log(
            `QuestToTaxaRepository constructed for table '${tableName}' with dbPool:`
        )
    }
}
