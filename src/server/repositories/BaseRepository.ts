import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

export type GetColumnsOptions<T> = {
    orderByColumn: keyof T
    order: 'asc' | 'desc'
}

export type BaseRepository<T> = ReturnType<typeof createBaseRepository<T>>

export function createBaseRepository<T>(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof T)[]
) {
    const getDb = () => dbPool
    const getTableName = () => tableName

    function assertValidColumns(input: (string | number)[]) {
        for (const col of input) {
            if (!validColumns.includes(col as keyof T)) {
                throw new Error(`Invalid column: ${col}`)
            }
        }
    }

    async function create(data: Partial<T>): Promise<number> {
        const columns = Object.keys(data)
        assertValidColumns(columns)

        const values = Object.values(data)
        const placeholders = values.map(() => '?').join(', ')

        const [result] = await dbPool.execute<ResultSetHeader>(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        )
        return result.insertId
    }

    async function update(
        id: number | undefined,
        data: object
    ): Promise<{ success: boolean; affectedRows: number }> {
        if (id == null) throw new Error('Cannot update without an ID')
        const columns = Object.keys(data)
        if (columns.length === 0)
            throw new Error('No fields provided for update')

        assertValidColumns(columns as (string | number)[])

        const values = Object.values(data)
        const setClause = columns.map((col) => `${col} = ?`).join(', ')

        const [result] = await dbPool.execute<ResultSetHeader>(
            `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
            [...values, id]
        )
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows,
        }
    }

    async function remove(
        id: number
    ): Promise<{ success: boolean; affectedRows: number }> {
        const [result] = await dbPool.execute<ResultSetHeader>(
            `DELETE FROM ${tableName} WHERE id = ?`,
            [id]
        )
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows,
        }
    }

    async function findOne(
        conditions: Partial<T>,
        selectColumns: (keyof T)[] = validColumns
    ): Promise<Partial<T> | null> {
        const keys = Object.keys(conditions) as (keyof T)[]
        if (keys.length === 0)
            throw new Error('findOne called without conditions')

        assertValidColumns(keys as (string | number)[])
        assertValidColumns(selectColumns as (string | number)[])

        const whereClause = keys
            .map((key) => `${String(key)} = ?`)
            .join(' AND ')
        const values = keys.map((key) => conditions[key])

        const columns = selectColumns
            .map((col) => `\`${String(col)}\``)
            .join(', ')

        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT ${columns} FROM ${tableName} WHERE ${whereClause} LIMIT 1`,
            values
        )

        return rows.length > 0 ? (rows[0] as Partial<T>) : null
    }

    async function findMany(
        conditions: Partial<T>,
        options: {
            limit?: number
            offset?: number
            orderByColumn?: keyof T
            order?: 'asc' | 'desc'
        } = {}
    ): Promise<T[]> {
        const whereClauses: string[] = []
        const values: unknown[] = []

        for (const [key, value] of Object.entries(conditions)) {
            if (!validColumns.includes(key as keyof T)) {
                throw new Error(`Invalid column in conditions: ${key}`)
            }
            whereClauses.push(`${key} = ?`)
            values.push(value)
        }

        let query = `SELECT * FROM ${tableName}`
        if (whereClauses.length) {
            query += ` WHERE ${whereClauses.join(' AND ')}`
        }

        if (options.orderByColumn) {
            assertValidColumns([options.orderByColumn] as (string | number)[])
            query += ` ORDER BY ${String(options.orderByColumn)} ${options.order?.toUpperCase() || 'ASC'}`
        }

        if (options.limit != null) {
            query += ` LIMIT ${options.limit}`
            if (options.offset != null) {
                query += ` OFFSET ${options.offset}`
            }
        }

        const [rows] = await dbPool.execute<RowDataPacket[]>(query, values)
        return rows as T[]
    }

    async function findRowByColumnAndValue<K extends keyof T>(
        column: K,
        value: T[K]
    ): Promise<T[]> {
        assertValidColumns([column] as (string | number)[])
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName} WHERE ${String(column)} = ?`,
            [value]
        )
        return rows as T[]
    }

    async function findAll(): Promise<T[]> {
        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT * FROM ${tableName}`
        )
        return rows as T[]
    }

    async function getColumns<K extends keyof T>(
        columns: K[],
        options: GetColumnsOptions<T>
    ): Promise<Pick<T, K>[]> {
        assertValidColumns(columns as (string | number)[])
        assertValidColumns([options.orderByColumn] as (string | number)[])

        const columnString = columns.join(', ')
        const order = options.order.toUpperCase()

        const [rows] = await dbPool.execute<RowDataPacket[]>(
            `SELECT ${columnString} FROM ${tableName} ORDER BY ${String(options.orderByColumn)} ${order}`
        )

        return rows.map((row) => {
            const partial: Partial<T> = {}
            for (const column of columns) {
                if (Object.hasOwn(row, column)) {
                    partial[column] = row[column as keyof typeof row]
                }
            }
            return partial as Pick<T, K>
        })
    }

    /**
     * New `find` method
     * Flexible method that accepts optional conditions, ordering, limit, and offset
     */
    async function find(
        conditions: Partial<T> = {},
        options: {
            limit?: number
            offset?: number
            orderByColumn?: keyof T
            order?: 'asc' | 'desc'
        } = {}
    ): Promise<T[]> {
        // Just call findMany under the hood
        return findMany(conditions, options)
    }

    return {
        getDb,
        getTableName,
        create,
        update,
        delete: remove,
        findOne,
        findMany,
        findRowByColumnAndValue,
        findAll,
        getColumns,
        find, // ✅ new method
    }
}
