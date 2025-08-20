import mysql, { Pool } from 'mysql2/promise'
import env from '../config/app.config.js'
import logger from '../config/logger.js'

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

        const connection = await dbPool.getConnection();
        connection.release();

        logger.info('Database connection successful ✅');
        return dbPool;
    } catch (err: any) {
        // Log the full error object
        logger.error('⛔️ Error connecting to the database:');
        logger.error(`Message: ${err.message}`);
        logger.error(`Code: ${err.code}`);
        logger.error(`Errno: ${err.errno}`);
        logger.error(`SQLState: ${err.sqlState}`);
        logger.error(`Stack: ${err.stack}`);

        if (dbPool) await dbPool.end();
        process.exit(1);
    }
};

export const getDbPool = () => {
    if (!dbPool) {
        throw new Error('⚠️ Database not initialized. Call initializeDb first.');
    }
    return dbPool;
};

export default { initializeDb, getDbPool };
