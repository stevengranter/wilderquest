import { Pool, RowDataPacket } from 'mysql2/promise'

export async function getTableColumns<T = unknown>(
    db: Pool,
    tableName: string
): Promise<(keyof T)[]> {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SHOW COLUMNS FROM ${tableName}`
    )
    return rows.map((row) => row.Field) as (keyof T)[]
}
