import mysql, {Pool} from 'mysql2/promise'
import appConfig from './config/appConfig.js'
import chalk from 'chalk'

let dbPool: Pool | undefined

export const initializeDb = async () => {
    try {
        dbPool = mysql.createPool({
            host: appConfig.MYSQL_HOST,
            port: appConfig.MYSQL_PORT,
            database: appConfig.MYSQL_DATABASE,
            user: appConfig.MYSQL_USER,
            password: appConfig.MYSQL_PASSWORD,
        })
        console.log('Database connection successful ✅ ')
        return dbPool
    } catch (error) {
        console.error('⛔️ Error connecting to the database:', error)
        throw error
    }
}

export const getDbPool = () => {
    if (!dbPool) {
        throw new Error('⚠️ Database not initialized. Call initializeDb first.')
    }
    return dbPool
}

export default {initializeDb, getDbPool}
