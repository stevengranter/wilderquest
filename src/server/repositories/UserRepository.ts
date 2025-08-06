import { Pool } from 'mysql2/promise'
import { User } from '../models/User.js'
import { createBaseRepository } from './BaseRepository.js'

export type UserRepository = ReturnType<typeof createUserRepository>

const safeUserColumns: (keyof User)[] = [
    'id',
    'username',
    'created_at',
    'updated_at',
]

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

    async function findUser(
        conditions: Partial<User>
    ): Promise<Partial<User> | null> {
        return base.findOne(conditions, safeUserColumns)
    }

    return {
        create,
        findUser,
    }
}
