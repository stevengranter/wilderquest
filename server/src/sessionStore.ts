import * as session from "express-session";
import MySQLStore from "express-mysql-session";
import dotenv from "dotenv";

dotenv.config();

type User = {
  email: string;
};

declare module "express-session" {
  interface SessionData {
    user: User | null;
  }
}

//Import the MySQLStore and pass the express session
const MySQLStoreSession = MySQLStore(session);

const sessionStore = new MySQLStoreSession({
  expiration: 86400 * 1000, // Session expires after 1 day (optional)
  clearExpired: true, // Automatically clear expired sessions (optional)
  checkExpirationInterval: 3600000, // Check for expired sessions every hour (optional)
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  user: "root",
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: "myapp",
});

// Optionally use onReady() to get a promise that resolves when store is ready.
sessionStore
  .onReady()
  .then(() => {
    // MySQL session store ready for use.
    console.log("MySQLStore ready");
  })
  .catch((error) => {
    // Something went wrong.
    console.error(error);
  });

export default sessionStore;
