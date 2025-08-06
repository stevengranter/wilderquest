import { Pool } from 'mysql2/promise'
import { User } from '../models/User.js'
import { createBaseRepository } from './BaseRepository.js'

export type UserRepository = ReturnType<typeof createUserRepository>

export function createUserRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof User)[]
) {
    const base = createBaseRepository<User>(tableName, dbPool, validColumns)

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
        create,
    }
}
