/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],

    // Improved output formatting
    verbose: true,
    silent: false,
    notify: false,

    // Better test discovery
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).ts',
        '**/?(*.)+(spec|test).js',
    ],

    // Transform configuration with ts-jest options
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ESNext',
                    target: 'ES2020',
                    moduleResolution: 'NodeNext',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                },
            },
        ],
    },

    // Module mapping
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/**/types.ts',
        '!src/client/vite-env.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Test configuration
    testTimeout: 10000,
    moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

    // Output formatting - cleaner and more informative
    reporters: ['default'],
}
