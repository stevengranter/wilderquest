import { Pool, RowDataPacket } from 'mysql2/promise';
import db from '../db.js'; // Import the database connection


export type getColumnsOptions = {
  orderByColumn: string;
  order: "desc" | "asc";
}

class BaseRepository<T> {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // method to find one record matching conditions
  async findOne(conditions: Partial<{}>): Promise<T | null> {
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
      const query = `SELECT * FROM ${this.tableName} WHERE ${whereSql} LIMIT 1`;

      // Execute the query with the values array to prevent SQL injection
      const [rows] = await db.execute<RowDataPacket[]>(query, values);

      // If no rows are found, return null
      return rows.length > 0 ? (rows[0] as T) : null;
    } catch (error) {
      console.error('Error in findOne method:', error);
      throw error;
    }
  }

  // Method to get all records from the table
  async getAll(): Promise<T[]> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM ${this.tableName}`);
      return rows as T[];
    } catch (error) {
      console.error(`Error fetching all records from ${this.tableName}:`, error);
      throw error;
    }
  }

  // Method to get only certain columns
  async getColumns(columns: string[], options: getColumnsOptions): Promise<Partial<T>[]> {
    try {
      const columnString = columns.join(', ');
      const order = options.order.toUpperCase() || "ASC"
      const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${columnString} FROM ${this.tableName} ORDER BY ${options.orderByColumn} ${order}`);

      // Map the results to Partial<T> to ensure type safety, as only selected columns are returned.
      return rows.map(row => {
        const partialT: Partial<T> = {};
        columns.forEach(column => {
          if (row.hasOwnProperty(column)) {
            partialT[column as keyof T] = row[column];
          }
        });
        return partialT;
      });

    } catch (error) {
      console.error(`Error fetching columns ${columns.join(', ')} from ${this.tableName}:`, error);
      throw error;
    }
  }

  // Method to get a record by ID
  async getById(id: number): Promise<T | undefined> {
    try {
      const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
      return rows[0] as T | undefined; // Return the first record, if found
    } catch (error) {
      console.error(`Error fetching record by ID from ${this.tableName}:`, error);
      throw error;
    }
  }

  // Method to create a new record
  async create(data: Partial<T>): Promise<number> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');

    try {
      const [result] = await db.execute<any>(
          `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
          values
      );
      return result.insertId; // Return the ID of the newly inserted record
    } catch (error) {
      console.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Method to update a record by ID
  async update(id: number, data: Partial<T>): Promise<boolean> {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const setClause = columns.map((col) => `${col} = ?`).join(', ');
    console.log(setClause);
    console.log({values})
    try {
      const [result] = await db.execute<any>(
          `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
          [...values, id]
      );
      return result.affectedRows > 0; // Return true if rows were updated
    } catch (error) {
      console.error(`Error updating record in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Method to delete a record by ID
  async delete(id: number): Promise<boolean> {
    try {
      const [result] = await db.execute<any>(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      return result.affectedRows > 0; // Return true if rows were deleted
    } catch (error) {
      console.error(`Error deleting record from ${this.tableName}:`, error);
      throw error;
    }
  }
}

export default BaseRepository;
