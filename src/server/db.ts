import mysql from "mysql2/promise"
import dbConfig from "./config/dbConfig.js";

const db = mysql.createPool(dbConfig);

export default db
