// UserRepository Unit Tests
// Testing user-specific functionality with security focus

import { createUserRepository } from '../UserRepository.js'
import { User } from '../../models/user.js'
import {
    mockEmptyQuery,
    mockExecute,
    mockSuccessfulInsert,
    mockSuccessfulQuery,
    resetMocks,
} from './helpers/testUtils.js'

// Mock mysql2/promise
const mockPool = {
    execute: mockExecute,
}

jest.mock('mysql2/promise', () => ({
    Pool: jest.fn(() => mockPool),
    ResultSetHeader: jest.fn(),
    RowDataPacket: jest.fn(),
}))

// User columns for testing
const validUserColumns: (keyof User)[] = [
    'id',
    'username',
    'email',
    'password',
    'user_cuid',
    'created_at',
    'updated_at',
    'role_id',
    'refresh_token',
]

describe('UserRepository', () => {
    let userRepo: ReturnType<typeof createUserRepository>

    beforeEach(() => {
        resetMocks()
        userRepo = createUserRepository(
            'users',
            mockPool as any,
            validUserColumns
        )
    })

    describe('findUserForDisplay', () => {
        it('should return safe user data without sensitive fields', async () => {
            // Mock database returning only safe columns
            const mockSafeUserData = [
                {
                    id: 1,
                    username: 'testuser',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]
            mockSuccessfulQuery(mockSafeUserData)

            const result = await userRepo.findUserForDisplay({ id: 1 })

            expect(result).toEqual({
                id: 1,
                username: 'testuser',
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
            })
            // Should NOT contain sensitive data
            expect(result).not.toHaveProperty('email')
            expect(result).not.toHaveProperty('password')
        })

        it('should return null when user not found', async () => {
            mockEmptyQuery()

            const result = await userRepo.findUserForDisplay({ id: 999 })

            expect(result).toBeNull()
        })
    })

    describe('findUsersForAdmin', () => {
        const mockUsers: User[] = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin_hash',
                user_cuid: 'admin-cuid',
                role_id: 1,
                refresh_token: 'admin-token',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]

        it('should return full user data including sensitive fields', async () => {
            mockSuccessfulQuery(mockUsers)

            const result = await userRepo.findUsersForAdmin({
                username: 'admin',
            })

            expect(result[0]).toEqual(mockUsers[0])
            // Should contain ALL fields including sensitive ones
            expect(result[0]).toHaveProperty('email')
            expect(result[0]).toHaveProperty('password')
        })

        it('should find all users without conditions', async () => {
            mockSuccessfulQuery(mockUsers)

            const result = await userRepo.findUsersForAdmin()

            expect(result).toEqual(mockUsers)
        })
    })

    describe('create', () => {
        it('should create user with auto-generated timestamps', async () => {
            mockSuccessfulInsert(123)

            const result = await userRepo.create({
                username: 'newuser',
                email: 'new@example.com',
                password: 'password',
                user_cuid: 'new-cuid',
                role_id: 1,
            })

            expect(result).toBe(123)
        })
    })
})
