import { Pool, RowDataPacket } from 'mysql2/promise'
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

    async findAccessibleById(
        id: number,
        userId?: number
    ): Promise<Quest | null> {
        const query = `
    SELECT * FROM ${this.getTableName()}
    WHERE id = ?
      AND (is_private = FALSE OR user_id = ?)
    LIMIT 1
  `
        const [rows] = await this.getDb().execute<RowDataPacket[]>(query, [
            id,
            userId ?? -1,
        ])
        return rows.length > 0 ? (rows[0] as Quest) : null
    }

    async findAccessibleByUserId(
        userId: number,
    ): Promise<Quest[]> {
        const query = `
    SELECT * FROM ${this.getTableName()}
    WHERE user_id = ?
      AND (is_private = FALSE OR user_id = ?)
        `
        const [rows] = await this.getDb().execute<RowDataPacket[]>(query, [
            userId,
            userId,
        ])
        return rows as Quest[]
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
