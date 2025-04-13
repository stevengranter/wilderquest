import BaseRepository, {getColumnsOptions} from './BaseRepository.js';
import {RowDataPacket} from "mysql2/promise";
import {UserData} from "../../types/types.js";

class UsersRepository extends BaseRepository<UserData> {
    constructor() {
        super('user_data');
    }

    async getColumns(columns: string[], {
        orderByColumn = columns[0],
        order = "asc"
    }: getColumnsOptions): Promise<Partial<UserData>[]> {
        return super.getColumns(columns, {orderByColumn, order});
    }

    async create(data: Partial<UserData>): Promise<number> {
        const date = new Date();
        const dateString = date.toLocaleDateString("en-CA");
        const created_at = dateString;
        const updated_at = dateString;
        const newData = {...data, created_at, updated_at};
        return await super.create(newData);
    }

    // Removed duplicate findOne method, using the one from BaseRepository

    async getUsersByEmail(email: string): Promise<UserData[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>('SELECT * FROM user_data WHERE email = ?', [email]);
            return rows as UserData[];
        } catch (error) {
            console.error('Error fetching users by email:', error);
            throw error;
        }
    }

    async getUsersByUsername(username: string): Promise<UserData[]> {
        try {
            const [rows] = await this.getDb().execute<RowDataPacket[]>('SELECT * FROM user_data WHERE username = ?', [username]);
            return rows as UserData[];
        } catch (error) {
            console.error('Error fetching users by username:', error);
            throw error;
        }
    }
}

export default new UsersRepository(); // Export a single instance
