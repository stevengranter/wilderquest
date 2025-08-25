import { type Pool } from 'mysql2/promise'
import { type SafeUserDTO, type User } from '../models/index.js'
import { createBaseRepository } from './BaseRepository.js'

// Explicitly list only the safe columns
export const safeUserColumns = [
    'id',
    'username',
    'created_at',
    'updated_at',
] as const satisfies (keyof SafeUserDTO)[]

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

    async function findUser(
        conditions: Partial<User>
    ): Promise<Partial<SafeUserDTO> | null> {
        return base.findOne(conditions, safeUserColumns)
    }

    return {
        ...base,
        create,
        findUser,
    }
}
