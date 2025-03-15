import mysql from "mysql2/promise";
import dotenv from "dotenv";
import chalk from "chalk";
dotenv.config();

// Asynchronous function to connect to the database
const connection = async () => {
  try {
    // Create a connection to the MySQL database
    const db = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });
    console.log(chalk.green.bold("📚 Database connected successfully")); // Log
    // success
    // message
    return db;
  } catch (error) {
    console.log(
      chalk.red.italic("⛔️ Error while connecting with the database"),
    ); // Log
    // error
    // message
    throw error;
  }
};
export default connection; // Export the connection function as default
