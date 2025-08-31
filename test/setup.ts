// test/setup.ts

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Global test setup
beforeAll(() => {
    // Setup code that runs before all tests
    console.log('🧪 Setting up test environment...')
})

afterAll(() => {
    // Cleanup code that runs after all tests
    console.log('🧪 Cleaning up test environment...')
})

// Mock console methods to reduce noise during tests
let originalConsoleError: typeof console.error
let originalConsoleWarn: typeof console.warn

beforeEach(() => {
    originalConsoleError = console.error
    originalConsoleWarn = console.warn
    console.error = jest.fn()
    console.warn = jest.fn()
})

afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
})
