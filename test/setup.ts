// test/setup.ts

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Auth service environment variables
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-for-jest'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-jest'

// Database environment variables
process.env.MYSQL_HOST = 'localhost'
process.env.MYSQL_PORT = '3306'
process.env.MYSQL_DATABASE = 'wildernest_test'
process.env.MYSQL_USER = 'test'
process.env.MYSQL_PASSWORD = 'test'

// Redis
process.env.REDIS_URL = 'redis://localhost:6379'

// API keys
process.env.MAP_TILES_API_KEY = 'test-api-key'

// Global test setup - keep it quiet
beforeAll(() => {
    // Setup code that runs before all tests (no logging)
})

afterAll(() => {
    // Cleanup code that runs after all tests (no logging)
})

// Mock console methods to reduce noise during tests
let originalConsoleLog: typeof console.log
let originalConsoleInfo: typeof console.info
let originalConsoleDebug: typeof console.debug
let originalConsoleError: typeof console.error
let originalConsoleWarn: typeof console.warn

beforeEach(() => {
    // Store original console methods
    originalConsoleLog = console.log
    originalConsoleInfo = console.info
    originalConsoleDebug = console.debug
    originalConsoleError = console.error
    originalConsoleWarn = console.warn

    // Mock console methods to reduce test noise
    console.log = jest.fn()
    console.info = jest.fn()
    console.debug = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
})

afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog
    console.info = originalConsoleInfo
    console.debug = originalConsoleDebug
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
})

// Note: Winston logger is intentionally not mocked to preserve test functionality
// The console output suppression above handles most noise
