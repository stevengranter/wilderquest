import mysql, { Pool } from 'mysql2/promise'
import env from '../config/app.config.js'
import logger from '../config/logger'

let dbPool: Pool | undefined;

export const initializeDb = async () => {
	try {
		dbPool = mysql.createPool({
			host: env.MYSQL_HOST,
			port: env.MYSQL_PORT,
			database: env.MYSQL_DATABASE,
			user: env.MYSQL_USER,
			password: env.MYSQL_PASSWORD,
		});
		logger.info('Database connection successful ✅ ');
		return dbPool;
	} catch (error) {
		logger.error('⛔️ Error connecting to the database:', error);
		throw error;
	}
};

export const getDbPool = () => {
	if (!dbPool) {
		throw new Error('⚠️ Database not initialized. Call initializeDb first.');
	}
	return dbPool;
};

export default { initializeDb, getDbPool };
