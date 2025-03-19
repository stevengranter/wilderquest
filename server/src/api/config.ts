import dotenv from "dotenv";
dotenv.config();

const config = {
  db: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: 3306,
    database: process.env.MYSQL_DATABASE,
  },
};

export default config;
