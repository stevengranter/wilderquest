import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
import { connection } from "../../dbConnect.js";

dotenv.config();

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
