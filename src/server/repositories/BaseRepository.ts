import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

export type getColumnsOptions = {
    orderByColumn: string
    order: 'desc' | 'asc'
}

export interface IBaseRepository<T> {
    getDb(): Pool
    getTableName(): string

    create(data: Partial<T>): Promise<number>
    update(id: number | undefined, data: object): Promise<boolean>
    delete(id: number): Promise<boolean>

    findOne(conditions: Partial<T>): Promise<T | null>
    findMany(conditions: Partial<T>, options?: {}): Promise<T[]>
    findRowByColumnAndValue<K>(
        column: K,
        value: string | number
    ): Promise<unknown[]>
    findAll(): Promise<T[]>

    getColumns(
        columns: string[],
        options: getColumnsOptions
    ): Promise<Partial<T>[]>
}

export type BaseRepositoryInstance<T> = BaseRepository<T>

class BaseRepository<T> implements IBaseRepository<T> {
    private tableName: string
    private dbPool: Pool // Store the injected database pool

    constructor(tableName: string, dbPool: Pool) {
        // Inject the dbPool
        this.tableName = tableName
        this.dbPool = dbPool
    }

    // Now, getDb() simply returns the injected pool
    public getDb(): Pool {
        return this.dbPool
    }

    public getTableName(): string {
        return this.tableName
    }

    async create(data: Partial<T>): Promise<number> {
        const columns = Object.keys(data).join(', ')
        const values = Object.values(data)
        const placeholders = values.map(() => '?').join(', ')

        try {
            const [result] = await this.dbPool.execute<ResultSetHeader>(
                `INSERT INTO ${this.tableName} (${columns})
                 VALUES (${placeholders})`,
                values
            )
            return result.insertId
        } catch (error) {
            console.error(`Error creating record in ${this.tableName}:`, error)
            throw error
        }
    }

    async update(id: number | undefined, data: object): Promise<boolean> {
        const columns = Object.keys(data)
        const values = Object.values(data)
        console.log('data: ', data)
        console.log('columns: ', columns)
        console.log('values: ', values)
        const setClause = columns.map((col) => `${col} = ?`).join(', ')
        console.log(setClause)
        console.log({ values })
        try {
            const [result] = await this.dbPool.execute<ResultSetHeader>(
                `UPDATE ${this.tableName}
                 SET ${setClause}
                 WHERE id = ?`,
                [...values, id]
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error(`Error updating record in ${this.tableName}:`, error)
            throw error
        }
    }

    async delete(id: number): Promise<boolean> {
        try {
            const [result] = await this.dbPool.execute<ResultSetHeader>(
                `DELETE
                     FROM ${this.tableName}
                     WHERE id = ?`,
                [id]
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error(
                `Error deleting record from ${this.tableName}:`,
                error
            )
            throw error
        }
    }

    async findOne(conditions: Partial<T>): Promise<T | null> {
        try {
            const keys = Object.keys(conditions) as (keyof T)[]
            if (keys.length === 0) {
                throw new Error('findOne called without conditions')
            }

            const whereClause = keys
                .map((key) => `${String(key)} = ?`)
                .join(' AND ')
            const values = keys.map((key) => conditions[key])

            const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`
            const [rows] = await this.dbPool.execute<RowDataPacket[]>(
                query,
                values
            )

            return rows.length > 0 ? (rows[0] as T) : null
        } catch (error) {
            console.error(`Error in findOne for ${this.tableName}:`, error)
            throw error // rethrow to satisfy the linter
        }
    }

    async findMany(
        conditions: Partial<T>,
        options?: {
            limit?: number
            offset?: number
            orderByColumn?: string
            order?: 'asc' | 'desc'
        }
    ): Promise<T[]> {
        try {
            const whereClauses = []
            const values: unknown[] = []

            for (const [key, value] of Object.entries(conditions)) {
                whereClauses.push(`${key} = ?`)
                values.push(value)
            }

            let whereSql = ''
            if (whereClauses.length > 0) {
                whereSql = `WHERE ${whereClauses.join(' AND ')}`
            }

            let orderBySql = ''
            if (options?.orderByColumn) {
                orderBySql = `ORDER BY ${options.orderByColumn} ${options.order?.toUpperCase() || 'ASC'}`
            }

            let limitSql = ''
            if (options?.limit) {
                limitSql = `LIMIT ${options.limit}`
                if (options?.offset) {
                    limitSql += ` OFFSET ${options.offset}`
                }
            }

            const query = `SELECT * FROM ${this.tableName} ${whereSql} ${orderBySql} ${limitSql}`

            const [rows] = await this.dbPool.execute<RowDataPacket[]>(
                query,
                values
            )
            return rows as T[]
        } catch (error) {
            console.error('Error in findMany method:', error)
            throw error
        }
    }

    async findRowByColumnAndValue<K>(
        column: K,
        value: string | number
    ): Promise<unknown[]> {
        const [rows] = await this.getDb().execute<RowDataPacket[]>(
            `SELECT * FROM ${this.getTableName()} WHERE ${column} = ?`,
            [value]
        )
        return rows
    }

    async findAll(): Promise<T[]> {
        try {
            const [rows] = await this.dbPool.execute<RowDataPacket[]>(`SELECT *
                                                                 FROM ${this.tableName}`)
            return rows as T[]
        } catch (error) {
            console.error(
                `Error fetching all records from ${this.tableName}:`,
                error
            )
            throw error
        }
    }

    async getColumns(
        columns: string[],
        options: getColumnsOptions
    ): Promise<Partial<T>[]> {
        try {
            const columnString = columns.join(', ')
            const order = options.order.toUpperCase() || 'ASC'
            const [rows] = await this.dbPool.execute<
                RowDataPacket[]
            >(`SELECT ${columnString}
                                                                 FROM ${this.tableName}
                                                                 ORDER BY ${options.orderByColumn} ${order}`)

            return rows.map((row) => {
                const partialT: Partial<T> = {}
                columns.forEach((column) => {
                    if (Object.hasOwn(row, column)) {
                        partialT[column as keyof T] = row[column]
                    }
                })
                return partialT
            })
        } catch (error) {
            console.error(
                `Error fetching columns ${columns.join(', ')} from ${this.tableName}:`,
                error
            )
            throw error
        }
    }
}

export default BaseRepository
