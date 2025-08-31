// Repository factory helpers for testing

import { createBaseRepository } from '../../BaseRepository.js'
import { TestEntity, validTestColumns } from '../mocks/testData.js'

// Mock database pool
const mockDbPool = {
    execute: jest.fn(),
}

// Create a test repository instance
export function createTestRepository(tableName = 'test_table') {
    return createBaseRepository<TestEntity>(
        tableName,
        mockDbPool as any,
        validTestColumns
    )
}

// Create repository with custom configuration
export function createTestRepositoryWithConfig(
    tableName: string,
    customColumns: (keyof TestEntity)[] = validTestColumns
) {
    return createBaseRepository<TestEntity>(
        tableName,
        mockDbPool as any,
        customColumns
    )
}

// Reset the mock database pool
export function resetMockDbPool() {
    mockDbPool.execute.mockClear()
}

// Get the mock database pool for direct manipulation
export function getMockDbPool() {
    return mockDbPool
}
