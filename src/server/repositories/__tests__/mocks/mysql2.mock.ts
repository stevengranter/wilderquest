// Mock utilities for mysql2/promise testing
export const mockDbPool = {
    execute: jest.fn(),
}

export const mockResultSetHeader = {
    insertId: 123,
    affectedRows: 1,
    changedRows: 1,
}

export const mockRowDataPacket = [
    { id: 1, name: 'Test Entity', created_at: new Date() },
]

// Mock mysql2/promise module
jest.mock('mysql2/promise', () => ({
    Pool: jest.fn(() => mockDbPool),
    ResultSetHeader: jest.fn(),
    RowDataPacket: jest.fn(),
}))

// Helper to create proper mysql2 result format
export function createMockResult(rows: any[]): [any[], any] {
    return [rows, []] // [rows, fields] - fields is typically an empty array for our purposes
}

export function createMockInsertResult(
    insertId: number,
    affectedRows = 1
): [any, any] {
    return [{ insertId, affectedRows, changedRows: affectedRows }, undefined]
}

export function createMockUpdateResult(affectedRows = 1): [any, any] {
    return [{ affectedRows, changedRows: affectedRows, insertId: 0 }, undefined]
}

export function createMockDeleteResult(affectedRows = 1): [any, any] {
    return [{ affectedRows, changedRows: 0, insertId: 0 }, undefined]
}
