import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import dbConfig from "../config/dbConfig.js"

// * Database setup * //

let connection: Pool | undefined // Important: Declare `connection` as possibly undefined

const initializeDatabaseConnection = async () => {
    try {
        const pool = mysql.createPool(dbConfig)
        console.log("Database connection successful!")
        return pool
    } catch (error) {
        console.error("Error connecting to the database:", error)
    }
}

connection = await initializeDatabaseConnection()

// Function for SELECT queries (returning rows)
async function query<T extends RowDataPacket[]>(
    sql: string,
    params?: unknown
): Promise<T> {
    if (!connection) {
        throw new Error(
            "Database connection failed.  Please check your configuration and ensure the database is running."
        )
    }
    const [rows] = await connection.execute<T>(sql, params)
    return rows
}

// Function for INSERT/UPDATE/DELETE queries (returning ResultSetHeader)
async function mutate(sql: string, params?: unknown): Promise<ResultSetHeader> {
    if (!connection) {
        throw new Error(
            "Database connection failed.  Please check your configuration and ensure the database is running."
        )
    }
    const [result] = await connection.execute<ResultSetHeader>(sql, params)
    return result
}

const dbService = { query, mutate }
export { dbService }
