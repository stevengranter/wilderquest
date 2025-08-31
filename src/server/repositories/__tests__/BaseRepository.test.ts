// BaseRepository Unit Tests
// Comprehensive testing of all CRUD operations and query methods

import { createBaseRepository } from '../BaseRepository.js'
import { TestEntity, validTestColumns } from './mocks/testData.js'
import {
    mockDatabaseError,
    mockEmptyQuery,
    mockExecute,
    mockSuccessfulDelete,
    mockSuccessfulInsert,
    mockSuccessfulQuery,
    mockSuccessfulUpdate,
    resetMocks,
} from './helpers/testUtils.js'

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
    Pool: jest.fn(() => ({
        execute: mockExecute,
    })),
    ResultSetHeader: jest.fn(),
    RowDataPacket: jest.fn(),
}))

describe('BaseRepository', () => {
    let repository: ReturnType<typeof createBaseRepository>

    beforeEach(() => {
        resetMocks()
        repository = createBaseRepository<TestEntity>(
            'test_table',
            { execute: mockExecute } as any,
            validTestColumns
        )
    })

    describe('Repository Creation', () => {
        it('should create repository with valid parameters', () => {
            expect(repository).toBeDefined()
            expect(typeof repository.create).toBe('function')
            expect(typeof repository.findOne).toBe('function')
            expect(typeof repository.update).toBe('function')
        })

        it('should expose getDb and getTableName methods', () => {
            expect(typeof (repository as any).getDb).toBe('function')
            expect(typeof (repository as any).getTableName).toBe('function')
            expect((repository as any).getTableName()).toBe('test_table')
        })
    })

    describe('create', () => {
        it('should create entity with all valid columns', async () => {
            mockSuccessfulInsert(123)

            const result = await repository.create({
                name: 'Test Entity',
                description: 'Test description',
                created_at: new Date(),
                updated_at: new Date(),
            })

            expect(result).toBe(123)
            expect(mockExecute).toHaveBeenCalledWith(
                'INSERT INTO test_table (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
                [
                    'Test Entity',
                    'Test description',
                    expect.any(Date),
                    expect.any(Date),
                ]
            )
        })

        it('should create entity with partial data', async () => {
            mockSuccessfulInsert(456)

            const result = await repository.create({
                name: 'Partial Entity',
                created_at: new Date(),
                updated_at: new Date(),
            })

            expect(result).toBe(456)
            expect(mockExecute).toHaveBeenCalledWith(
                'INSERT INTO test_table (name, created_at, updated_at) VALUES (?, ?, ?)',
                ['Partial Entity', expect.any(Date), expect.any(Date)]
            )
        })

        it('should validate column names', async () => {
            await expect(
                repository.create({
                    name: 'Test',
                    invalidColumn: 'value',
                    created_at: new Date(),
                    updated_at: new Date(),
                } as any)
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should handle database errors', async () => {
            mockDatabaseError('Connection failed')

            await expect(
                repository.create({
                    name: 'Test',
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            ).rejects.toThrow('Connection failed')
        })
    })

    describe('update', () => {
        it('should update entity with valid id and data', async () => {
            mockSuccessfulUpdate(1)

            const result = await repository.update(1, {
                name: 'Updated Name',
                description: 'Updated description',
            })

            expect(result).toEqual({
                success: true,
                affectedRows: 1,
            })
            expect(mockExecute).toHaveBeenCalledWith(
                'UPDATE test_table SET name = ?, description = ? WHERE id = ?',
                ['Updated Name', 'Updated description', 1]
            )
        })

        it('should return success when no rows affected', async () => {
            mockSuccessfulUpdate(0)

            const result = await repository.update(999, { name: 'Test' })

            expect(result).toEqual({
                success: false,
                affectedRows: 0,
            })
        })

        it('should validate column names in update data', async () => {
            await expect(
                repository.update(1, { invalidColumn: 'value' } as any)
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should throw error for null/undefined id', async () => {
            await expect(
                repository.update(null as any, { name: 'Test' })
            ).rejects.toThrow('Cannot update without an ID')
            await expect(
                repository.update(undefined as any, { name: 'Test' })
            ).rejects.toThrow('Cannot update without an ID')
        })

        it('should handle empty update data', async () => {
            await expect(repository.update(1, {})).rejects.toThrow(
                'No fields provided for update'
            )
        })

        it('should handle database errors', async () => {
            mockDatabaseError('Update failed')

            await expect(
                repository.update(1, { name: 'Test' })
            ).rejects.toThrow('Update failed')
        })
    })

    describe('remove', () => {
        it('should delete entity by id', async () => {
            mockSuccessfulDelete(1)

            const result = await (repository as any).delete(1)

            expect(result).toEqual({
                success: true,
                affectedRows: 1,
            })
            expect(mockExecute).toHaveBeenCalledWith(
                'DELETE FROM test_table WHERE id = ?',
                [1]
            )
        })

        it('should handle non-existent id', async () => {
            mockSuccessfulDelete(0)

            const result = await (repository as any).delete(999)

            expect(result).toEqual({
                success: false,
                affectedRows: 0,
            })
        })

        it('should handle database errors', async () => {
            mockDatabaseError('Delete failed')

            await expect((repository as any).delete(1)).rejects.toThrow(
                'Delete failed'
            )
        })
    })

    describe('findOne', () => {
        it('should find entity by single condition', async () => {
            const mockRow = { id: 1, name: 'Test Entity', description: 'Test' }
            mockSuccessfulQuery([mockRow])

            const result = await repository.findOne({ id: 1 })

            expect(result).toEqual(mockRow)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT `id`, `name`, `description`, `created_at`, `updated_at` FROM test_table WHERE id = ? LIMIT 1',
                [1]
            )
        })

        it('should find entity by multiple conditions', async () => {
            const mockRow = { id: 1, name: 'Test Entity', description: 'Test' }
            mockSuccessfulQuery([mockRow])

            const result = await repository.findOne({
                id: 1,
                name: 'Test Entity',
            })

            expect(result).toEqual(mockRow)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT `id`, `name`, `description`, `created_at`, `updated_at` FROM test_table WHERE id = ? AND name = ? LIMIT 1',
                [1, 'Test Entity']
            )
        })

        it('should return null when not found', async () => {
            mockEmptyQuery()

            const result = await repository.findOne({ id: 999 })

            expect(result).toBeNull()
        })

        it('should validate condition columns', async () => {
            await expect(
                repository.findOne({ invalidColumn: 'value' } as any)
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should throw error for empty conditions', async () => {
            await expect(repository.findOne({})).rejects.toThrow(
                'findOne called without conditions'
            )
        })

        it('should use custom select columns', async () => {
            const mockRow = { id: 1, name: 'Test Entity' }
            mockSuccessfulQuery([mockRow])

            const result = await repository.findOne({ id: 1 }, ['id', 'name'])

            expect(result).toEqual(mockRow)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT `id`, `name` FROM test_table WHERE id = ? LIMIT 1',
                [1]
            )
        })

        it('should validate select columns', async () => {
            await expect(
                repository.findOne({ id: 1 }, ['invalidColumn'] as any)
            ).rejects.toThrow('Invalid column: invalidColumn')
        })
    })

    describe('findMany', () => {
        const mockRows = [
            { id: 1, name: 'Entity 1', description: 'First' },
            { id: 2, name: 'Entity 2', description: 'Second' },
        ]

        it('should find all entities without conditions', async () => {
            mockSuccessfulQuery(mockRows)

            const result = await repository.findMany({})

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table',
                []
            )
        })

        it('should find entities by single condition', async () => {
            mockSuccessfulQuery([mockRows[0]])

            const result = await repository.findMany({ name: 'Entity 1' })

            expect(result).toEqual([mockRows[0]])
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table WHERE name = ?',
                ['Entity 1']
            )
        })

        it('should handle limit and offset', async () => {
            mockSuccessfulQuery([mockRows[0]])

            const result = await repository.findMany(
                {},
                { limit: 10, offset: 5 }
            )

            expect(result).toEqual([mockRows[0]])
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table LIMIT 10 OFFSET 5',
                []
            )
        })

        it('should handle orderBy and order direction', async () => {
            mockSuccessfulQuery(mockRows)

            const result = await repository.findMany(
                {},
                { orderByColumn: 'name', order: 'desc' }
            )

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table ORDER BY name DESC',
                []
            )
        })

        it('should validate orderBy column', async () => {
            await expect(
                repository.findMany(
                    {},
                    { orderByColumn: 'invalidColumn' as any }
                )
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should combine conditions with limit/offset', async () => {
            mockSuccessfulQuery([mockRows[0]])

            const result = await repository.findMany(
                { name: 'Entity 1' },
                { limit: 5, offset: 10 }
            )

            expect(result).toEqual([mockRows[0]])
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table WHERE name = ? LIMIT 5 OFFSET 10',
                ['Entity 1']
            )
        })

        it('should handle empty results', async () => {
            mockEmptyQuery()

            const result = await repository.findMany({ name: 'Non-existent' })

            expect(result).toEqual([])
        })

        it('should validate condition columns', async () => {
            await expect(
                repository.findMany({ invalidColumn: 'value' } as any)
            ).rejects.toThrow('Invalid column in conditions: invalidColumn')
        })
    })

    describe('findRowByColumnAndValue', () => {
        const mockRows = [
            { id: 1, name: 'Test Entity', description: 'Test' },
            { id: 2, name: 'Another Entity', description: 'Another' },
        ]

        it('should find entities by column and value', async () => {
            mockSuccessfulQuery(mockRows)

            const result = await (repository as any).findRowByColumnAndValue(
                'name',
                'Test Entity'
            )

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table WHERE name = ?',
                ['Test Entity']
            )
        })

        it('should validate column name', async () => {
            await expect(
                (repository as any).findRowByColumnAndValue(
                    'invalidColumn',
                    'value'
                )
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should handle empty results', async () => {
            mockEmptyQuery()

            const result = await (repository as any).findRowByColumnAndValue(
                'name',
                'Non-existent'
            )

            expect(result).toEqual([])
        })

        it('should handle different data types', async () => {
            mockSuccessfulQuery([mockRows[0]])

            const result = await (repository as any).findRowByColumnAndValue(
                'id',
                1
            )

            expect(result).toEqual([mockRows[0]])
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table WHERE id = ?',
                [1]
            )
        })
    })

    describe('findAll', () => {
        const mockRows = [
            { id: 1, name: 'Entity 1' },
            { id: 2, name: 'Entity 2' },
        ]

        it('should return all entities', async () => {
            mockSuccessfulQuery(mockRows)

            const result = await repository.findAll()

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM test_table')
        })

        it('should handle empty table', async () => {
            mockEmptyQuery()

            const result = await repository.findAll()

            expect(result).toEqual([])
        })

        it('should handle database errors', async () => {
            mockDatabaseError('Query failed')

            await expect(repository.findAll()).rejects.toThrow('Query failed')
        })
    })

    describe('getColumns', () => {
        const mockRows = [
            { name: 'Entity 1', description: 'First' },
            { name: 'Entity 2', description: 'Second' },
        ]

        it('should select specific columns with ordering', async () => {
            mockSuccessfulQuery(mockRows)

            const result = await (repository as any).getColumns(
                ['name', 'description'],
                { orderByColumn: 'name', order: 'asc' }
            )

            expect(result).toEqual([
                { name: 'Entity 1', description: 'First' },
                { name: 'Entity 2', description: 'Second' },
            ])
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT name, description FROM test_table ORDER BY name ASC'
            )
        })

        it('should validate column names', async () => {
            await expect(
                (repository as any).getColumns(['invalidColumn'], {
                    orderByColumn: 'name',
                    order: 'asc',
                })
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should validate orderBy column', async () => {
            await expect(
                (repository as any).getColumns(['name'], {
                    orderByColumn: 'invalidColumn' as any,
                    order: 'asc',
                })
            ).rejects.toThrow('Invalid column: invalidColumn')
        })

        it('should handle ascending and descending order', async () => {
            mockSuccessfulQuery(mockRows)

            await (repository as any).getColumns(['name'], {
                orderByColumn: 'name',
                order: 'desc',
            })

            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT name FROM test_table ORDER BY name DESC'
            )
        })
    })

    describe('find', () => {
        it('should delegate to findMany with default params', async () => {
            const mockRows = [{ id: 1, name: 'Test' }]
            mockSuccessfulQuery(mockRows)

            const result = await repository.find()

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table',
                []
            )
        })

        it('should delegate to findMany with custom params', async () => {
            const mockRows = [{ id: 1, name: 'Test' }]
            mockSuccessfulQuery(mockRows)

            const result = await repository.find(
                { name: 'Test' },
                { limit: 10, orderByColumn: 'name', order: 'asc' }
            )

            expect(result).toEqual(mockRows)
            expect(mockExecute).toHaveBeenCalledWith(
                'SELECT * FROM test_table WHERE name = ? ORDER BY name ASC LIMIT 10',
                ['Test']
            )
        })
    })

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            mockDatabaseError('Connection lost')

            await expect(
                repository.create({
                    name: 'Test',
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            ).rejects.toThrow('Connection lost')
        })

        it('should handle query syntax errors', async () => {
            mockDatabaseError('Syntax error in SQL')

            await expect(repository.findOne({ id: 1 })).rejects.toThrow(
                'Syntax error in SQL'
            )
        })

        it('should handle constraint violations', async () => {
            const error = new Error('Duplicate entry')
            ;(error as any).code = 'ER_DUP_ENTRY'
            mockExecute.mockRejectedValueOnce(error)

            await expect(
                repository.create({
                    name: 'Test',
                    created_at: new Date(),
                    updated_at: new Date(),
                })
            ).rejects.toThrow('Duplicate entry')
        })

        it('should handle timeout errors', async () => {
            mockDatabaseError('Query timeout')

            await expect(repository.findMany({})).rejects.toThrow(
                'Query timeout'
            )
        })
    })
})
