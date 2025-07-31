import { Pool } from 'mysql2/promise'
import { User } from '../models/User.js'
import { createBaseRepository, GetColumnsOptions } from './BaseRepository.js'

export type UserRepository = ReturnType<typeof createUserRepository>

export function createUserRepository(tableName: string, dbPool: Pool) {
    const base = createBaseRepository<User>(tableName, dbPool)

    async function getColumns(
        columns: string[],
        { orderByColumn = columns[0], order = 'asc' }: GetColumnsOptions
    ): Promise<Partial<User>[]> {
        return base.getColumns(columns, { orderByColumn, order })
    }

    async function create(data: Partial<User>): Promise<number> {
        const now = new Date()
        return base.create({
            ...data,
            created_at: now,
            updated_at: now,
        })
    }

    return {
        ...base,
        getColumns,
        create,
    }
}
