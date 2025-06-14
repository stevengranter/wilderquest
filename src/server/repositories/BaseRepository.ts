import { RowDataPacket, Pool, ResultSetHeader } from 'mysql2/promise' // Import Pool type

export type getColumnsOptions = {
    orderByColumn: string;
    order: 'desc' | 'asc';
};

class BaseRepository<T> {
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

    public async findOne(conditions: Partial<T>): Promise<T | null> {
        try {
            const whereClauses = []
            const values: unknown[] = []

            for (const [key, value] of Object.entries(conditions)) {
                whereClauses.push(`${key} = ?`)
                values.push(value)
            }

            if (whereClauses.length === 0) {
                throw new Error('No conditions provided')
            }

            const whereSql = whereClauses.join(' AND ')

            const query = `SELECT *
                           FROM ${this.tableName}
                           WHERE ${whereSql}
                           LIMIT 1`;

            const [rows] = await this.dbPool.execute<RowDataPacket[]>(query, values) // Use this.dbPool directly

            return rows.length > 0 ? (rows[0] as T) : null
        } catch (error) {
            console.error('Error in findOne method:', error)
            throw error
        }
    }

    // ... (repeat for all other methods, replacing this.getDb().execute with this.dbPool.execute)
    async findMany(
        conditions: Partial<T>,
        options?: {
            limit?: number;
            offset?: number;
            orderByColumn?: string;
            order?: 'asc' | 'desc';
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

            const [rows] = await this.dbPool.execute<RowDataPacket[]>(query, values)
            return rows as T[]
        } catch (error) {
            console.error('Error in findMany method:', error)
            throw error
        }
    }

    async getAll(): Promise<T[]> {
        try {
            const [rows] = await this.dbPool.execute<RowDataPacket[]>(`SELECT *
                                                                 FROM ${this.tableName}`)
            return rows as T[]
        } catch (error) {
            console.error(`Error fetching all records from ${this.tableName}:`, error)
            throw error
        }
    }

    async getColumns(columns: string[], options: getColumnsOptions): Promise<Partial<T>[]> {
        try {
            const columnString = columns.join(', ')
            const order = options.order.toUpperCase() || 'ASC'
            const [rows] = await this.dbPool.execute<RowDataPacket[]>(`SELECT ${columnString}
                                                                 FROM ${this.tableName}
                                                                 ORDER BY ${options.orderByColumn} ${order}`)

            return rows.map((row) => {
                const partialT: Partial<T> = {}
                columns.forEach((column) => {
                    if (Object.prototype.hasOwnProperty.call(row, column)) {
                        partialT[column as keyof T] = row[column]
                    }
                });
                return partialT
            });
        } catch (error) {
            console.error(`Error fetching columns ${columns.join(', ')} from ${this.tableName}:`, error)
            throw error
        }
    }

    async getById(id: number): Promise<T | undefined> {
        try {
            const [rows] = await this.dbPool.execute<RowDataPacket[]>(
                `SELECT *
                                                                 FROM ${this.tableName}
                                                                 WHERE id = ?`,
                [id]
            );
            return rows[0] as T | undefined
        } catch (error) {
            console.error(`Error fetching record by ID from ${this.tableName}:`, error)
            throw error
        }
    }

    async create(data: Partial<T>): Promise<number> {
        const columns = Object.keys(data).join(', ')
        const values = Object.values(data)
        const placeholders = values.map(() => '?').join(', ')

        try {
            const [result] = await this.dbPool.execute<ResultSetHeader>(
                `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
                values
            );
            return result.insertId
        } catch (error) {
            console.error(`Error creating record in ${this.tableName}:`, error)
            throw error
        }
    }

    async update(id: number, data: Partial<T>): Promise<boolean> {
        const columns = Object.keys(data)
        const values = Object.values(data)

        const setClause = columns.map((col) => `${col} = ?`).join(', ')
        console.log(setClause)
        console.log({ values })
        try {
            const [result] = await this.dbPool.execute<ResultSetHeader>(
                `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
                [...values, id]
            );
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
            );
            return result.affectedRows > 0
        } catch (error) {
            console.error(`Error deleting record from ${this.tableName}:`, error)
            throw error
        }
    }
}

export default BaseRepository
