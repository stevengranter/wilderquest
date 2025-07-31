import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

export type GetColumnsOptions = {
    orderByColumn: string
    order: 'desc' | 'asc'
}

export interface BaseRepository<T> {
    getDb(): Pool
    getTableName(): string

    create(data: Partial<T>): Promise<number>
    update(id: number | undefined, data: object): Promise<boolean>
    delete(id: number): Promise<boolean>

    findOne(conditions: Partial<T>): Promise<T | null>
    findMany(
        conditions: Partial<T>,
        options?: {
            limit?: number
            offset?: number
            orderByColumn?: string
            order?: 'asc' | 'desc'
        }
    ): Promise<T[]>
    findRowByColumnAndValue<K>(
        column: K,
        value: string | number
    ): Promise<unknown[]>
    findAll(): Promise<T[]>
    getColumns(
        columns: string[],
        options: GetColumnsOptions
    ): Promise<Partial<T>[]>
}

export function createBaseRepository<T>(
    tableName: string,
    dbPool: Pool
): BaseRepository<T> {
    const getDb = () => dbPool
    const getTableName = () => tableName

    async function create(data: Partial<T>): Promise<number> {
        const columns = Object.keys(data).join(', ')
        const values = Object.values(data)
        const placeholders = values.map(() => '?').join(', ')

        const [result] = await dbPool.execute<ResultSetHeader>(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
            values
        )
        return result.insertId
    }

    async function update(
        id: number | undefined,
        data: object
    ): Promise<boolean> {
        const columns = Object.keys(data)
        const values = Object.values(data)
        const setClause = columns.map((col) => `${col} = ?`).join(', ')

        const [result] = await dbPool.execute<ResultSetHeader>(
            `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
            [...values, id]
        )
        return result.affectedRows > 0
    }

    async function remove(id: number): Promise<boolean> {
        const [result] = await dbPool.execute<ResultSetHeader>(
            `DELETE FROM ${tableName} WHERE id = ?`,
            [id]
        )
        return result.affectedRows > 0
    }

    async function findOne(conditions: Partial<T>): Promise<T | null> {
        const keys = Object.keys(conditions) as (keyof T)[]
        if (keys.length === 0) {
            throw new Error('findOne called without conditions')
        }

        const whereClause = keys
            .map((key) => `${String(key)} = ?`)
            .join(' AND ')
        const values = keys.map((key) => conditions[key])

        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT 1`,
            values
        )
        return rows.length > 0 ? (rows[0] as T) : null
    }

    async function findMany(
        conditions: Partial<T>,
        options: {
            limit?: number
            offset?: number
            orderByColumn?: string
            order?: 'asc' | 'desc'
        } = {}
    ): Promise<T[]> {
        const whereClauses: string[] = []
        const values: unknown[] = []

        for (const [key, value] of Object.entries(conditions)) {
            whereClauses.push(`${key} = ?`)
            values.push(value)
        }

        const whereSql = whereClauses.length
            ? `WHERE ${whereClauses.join(' AND ')}`
            : ''
        const orderBySql = options.orderByColumn
            ? `ORDER BY ${options.orderByColumn} ${options.order?.toUpperCase() || 'ASC'}`
            : ''
        const limitSql = options.limit
            ? `LIMIT ${options.limit}${options.offset ? ` OFFSET ${options.offset}` : ''}`
            : ''

        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName} ${whereSql} ${orderBySql} ${limitSql}`,
            values
        )
        return rows as T[]
    }

    async function findRowByColumnAndValue<K>(
        column: K,
        value: string | number
    ): Promise<unknown[]> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName} WHERE ${String(column)} = ?`,
            [value]
        )
        return rows
    }

    async function findAll(): Promise<T[]> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName}`
        )
        return rows as T[]
    }

    async function getColumns(
        columns: string[],
        options: GetColumnsOptions
    ): Promise<Partial<T>[]> {
        const columnString = columns.join(', ')
        const order = options.order.toUpperCase()

        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT ${columnString} FROM ${tableName} ORDER BY ${options.orderByColumn} ${order}`
        )

        return rows.map((row) => {
            const partial: Partial<T> = {}
            for (const column of columns) {
                if (Object.hasOwn(row, column)) {
                    partial[column as keyof T] = row[column]
                }
            }
            return partial
        })
    }

    return {
        getDb,
        getTableName,
        create,
        update,
        delete: remove, // "delete" is a reserved word in JS
        findOne,
        findMany,
        findRowByColumnAndValue,
        findAll,
        getColumns,
    }
}
