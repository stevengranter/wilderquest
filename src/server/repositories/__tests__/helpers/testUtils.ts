// Test utilities for BaseRepository testing

export const mockExecute = jest.fn()

// Mock database responses
export const mockSuccessfulInsert = (insertId = 123) => {
    mockExecute.mockResolvedValueOnce([
        {
            insertId,
            affectedRows: 1,
            changedRows: 1,
        },
    ])
}

export const mockSuccessfulUpdate = (affectedRows = 1) => {
    mockExecute.mockResolvedValueOnce([
        {
            insertId: 0,
            affectedRows,
            changedRows: affectedRows,
        },
    ])
}

export const mockSuccessfulDelete = (affectedRows = 1) => {
    mockExecute.mockResolvedValueOnce([
        {
            insertId: 0,
            affectedRows,
            changedRows: 0,
        },
    ])
}

export const mockSuccessfulQuery = (results: any[]) => {
    mockExecute.mockResolvedValueOnce([results])
}

export const mockEmptyQuery = () => {
    mockExecute.mockResolvedValueOnce([[]])
}

export const mockDatabaseError = (message = 'Database error') => {
    mockExecute.mockRejectedValueOnce(new Error(message))
}

export const mockConstraintError = () => {
    const error = new Error('Duplicate entry')
    ;(error as any).code = 'ER_DUP_ENTRY'
    mockExecute.mockRejectedValueOnce(error)
}

export const mockConnectionError = () => {
    const error = new Error('Connection lost')
    ;(error as any).code = 'ECONNRESET'
    mockExecute.mockRejectedValueOnce(error)
}

// Reset all mocks
export const resetMocks = () => {
    mockExecute.mockClear()
}

// Create mock result objects
export const createMockResult = (overrides = {}) => ({
    insertId: 123,
    affectedRows: 1,
    changedRows: 1,
    ...overrides,
})
