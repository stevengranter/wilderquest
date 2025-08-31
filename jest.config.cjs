/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            useESM: true,
            tsconfig: {
                module: 'ESNext',
                target: 'ES2020',
                moduleResolution: 'NodeNext',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        },
    },
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).ts',
        '**/?(*.)+(spec|test).js',
    ],
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/**/types.ts',
        '!src/client/vite-env.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000,
    moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
}
