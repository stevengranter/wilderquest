import BaseRepository, { type getColumnsOptions } from './BaseRepository.js'
import { Pool, RowDataPacket } from 'mysql2/promise'
import { User } from '../models/User.js'

// Instantiate a InstanceType for TypeScript completions
type UserRepositoryConstructor = typeof UserRepository;
export type UserRepositoryInstance = InstanceType<UserRepositoryConstructor>;

const allowedFields = {
    id: 'id',
    email: 'email',
    username: 'username',
} as const

export default class UserRepository extends BaseRepository<User> {
    constructor(tableName: string, dbPool: Pool) {
        super(tableName, dbPool)
        console.log(
            `UsersRepository constructed for table '${tableName}' with dbPool:`,
            dbPool ? 'exists' : 'does not exist',
        )
    }

    async getColumns(
        columns: string[],
        { orderByColumn = columns[0], order = 'asc' }: getColumnsOptions,
    ): Promise<Partial<User>[]> {
        return super.getColumns(columns, { orderByColumn, order })
    }

    async create(data: Partial<User>): Promise<number> {
        const created_at: Date = new Date()
        const updated_at: Date = new Date()
        const newData = { ...data, created_at, updated_at }
        return await super.create(newData)
    }




}
