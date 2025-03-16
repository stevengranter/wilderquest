import mysql, { ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
import chalk from "chalk";
import config from "../config.js";

dotenv.config();

async function createConnection() {
  try {
    const db = await mysql.createConnection(config.db);
    console.log(chalk.green.bold("📚 Database connected successfully")); // Log
    return db;
  } catch (error) {
    console.log(
      chalk.red.italic("⛔️ Error while connecting with the database"),
    );
    throw error;
  }
}

const connection = await createConnection();

async function query(sql: string, params?: unknown) {
  const [results] = await connection.execute<ResultSetHeader>(sql, params);
  return results;
}

const db = { query };
export { db };
