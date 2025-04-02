import BaseRepository from './BaseRepository.js';
import {RowDataPacket} from "mysql2/promise";
import db from "../db.js";

interface UserData {
    id: number;
    email: string;
    username: string;
    user_cuid: string;
    password: string;
    age: number;
    created_at: Date;
    updated_at: Date;
    refresh_token: string | null;
}

class UsersRepository extends BaseRepository<UserData> {
    constructor() {
        super('user_data');
    }



    async findOne(conditions: Partial<UserData>): Promise<UserData | null> {
        try {
            // Build the WHERE clause dynamically from the conditions object
            const whereClauses = [];
            const values: any[] = [];

            for (const [key, value] of Object.entries(conditions)) {
                whereClauses.push(`${key} = ?`);
                values.push(value);
            }

            // If no conditions are provided, throw an error (or handle as needed)
            if (whereClauses.length === 0) {
                throw new Error('No conditions provided');
            }

            // Join the WHERE clauses with 'AND'
            const whereSql = whereClauses.join(' AND ');

            // Build the full SQL query
            const query = `SELECT * FROM user_data WHERE ${whereSql} LIMIT 1`;

            // Execute the query with the values array to prevent SQL injection
            const [rows] = await db.execute<RowDataPacket[]>(query, values);

            // If no rows are found, return null
            return rows.length > 0 ? (rows[0] as UserData) : null;
        } catch (error) {
            console.error('Error in findOne method:', error);
            throw error;
        }
    }

    async getUsersByEmail(email: string): Promise<UserData[]> {
        try {
            const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM user_data WHERE email = ?', [email]);
            return rows as UserData[];
        } catch (error) {
            console.error('Error fetching users by email:', error);
            throw error;
        }
    }

    async getUsersByUsername(username: string): Promise<UserData[]> {
        try {
            const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM user_data WHERE username = ?', [username]);
            return rows as UserData[];
        } catch (error) {
            console.error('Error fetching users by username:', error);
            throw error;
        }
    }
}

export default new UsersRepository(); // Export a single instance
