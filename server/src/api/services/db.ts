import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
import chalk from "chalk";
import config from "../config.js";

dotenv.config();

async function createConnection() {
  try {
    const db = await mysql.createConnection(config.db);
    console.log(chalk.green.bold("📚 Database connected successfully"));
    return db;
  } catch (error) {
    console.log(
      chalk.red.italic("⛔️ Error while connecting with the database"),
    );
    throw error;
  }
}

const connection = await createConnection();

// Function for SELECT queries (returning rows)
async function querySelect<T extends RowDataPacket[]>(
  sql: string,
  params?: unknown,
): Promise<T> {
  const [rows] = await connection.execute<T>(sql, params);
  return rows;
}

// Function for INSERT/UPDATE/DELETE queries (returning ResultSetHeader)
async function queryModify(
  sql: string,
  params?: unknown,
): Promise<ResultSetHeader> {
  const [result] = await connection.execute<ResultSetHeader>(sql, params);
  return result;
}

const db = { querySelect, queryModify };
export { db };
