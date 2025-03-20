import dotenv from "dotenv";
import mysql from "mysql2/promise";
import config from "./config/config.js";
dotenv.config();

// Create a MySQL connection pool
export const connection = mysql.createPool(config.db);
