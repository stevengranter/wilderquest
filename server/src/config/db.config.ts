import dotenv from "dotenv";
dotenv.config();

export const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "myapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
