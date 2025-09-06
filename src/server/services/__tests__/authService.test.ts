// Mock jwt to avoid env dependency issues
const mockJwtSign = jest.fn(() => 'mock-jwt-token')
const mockJwtVerify = jest.fn()

jest.mock('jsonwebtoken', () => ({
    sign: mockJwtSign,
    verify: mockJwtVerify,
    default: {
        sign: mockJwtSign,
        verify: mockJwtVerify,
    },
}))

// Mock bcrypt-ts
jest.mock('bcrypt-ts', () => ({
    genSaltSync: jest.fn(() => 'salt'),
    hashSync: jest.fn((password: string) => `hashed_${password}`),
    compareSync: jest.fn(
        (password: string, hash: string) => hash === `hashed_${password}`
    ),
}))

// Mock cuid2
jest.mock('@paralleldrive/cuid2', () => ({
    createId: jest.fn(() => 'test-cuid-123'),
}))

import { createAuthService } from '../authService.js'
import { UserRepository } from '../../repositories/UserRepository.js'

describe('AuthService', () => {
    let mockUserRepo: jest.Mocked<UserRepository>
    let authService: ReturnType<typeof createAuthService>

    beforeEach(() => {
        jest.clearAllMocks()

        mockUserRepo = {
            findRowByColumnAndValue: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
        } as any

        authService = createAuthService(mockUserRepo)
    })

    describe('register', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        }

        it('should successfully register a new user with unique credentials', async () => {
            // Mock no existing users
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([]) // email check
                .mockResolvedValueOnce([]) // username check

            // Mock successful creation
            mockUserRepo.create.mockResolvedValue(1)

            // Mock finding the created user
            const mockCreatedUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                user_cuid: 'test-cuid-123',
                role_id: 1,
            }
            mockUserRepo.findOne.mockResolvedValue(mockCreatedUser)

            const result = await authService.register(
                validUserData.username,
                validUserData.email,
                validUserData.password
            )

            expect(result).toEqual({
                username: 'testuser',
                email: 'test@example.com',
                user_cuid: 'test-cuid-123',
                role_id: 1,
            })

            // Verify repository calls
            expect(mockUserRepo.findRowByColumnAndValue).toHaveBeenCalledWith(
                'email',
                'test@example.com'
            )
            expect(mockUserRepo.findRowByColumnAndValue).toHaveBeenCalledWith(
                'username',
                'testuser'
            )
            expect(mockUserRepo.create).toHaveBeenCalledWith({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed_password123', // Password should be hashed
                user_cuid: 'test-cuid-123',
                role_id: 1,
            })
            expect(mockUserRepo.findOne).toHaveBeenCalledWith({ id: 1 })
        })

        it('should throw error when email already exists', async () => {
            // Mock existing email
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([
                    {
                        id: 1,
                        username: 'existinguser',
                        email: 'test@example.com',
                        password: 'hashed_pass',
                        user_cuid: 'existing-cuid',
                        role_id: 1,
                    },
                ]) // email exists
                .mockResolvedValueOnce([]) // username check

            await expect(
                authService.register(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('Username and/or email already exists')

            expect(mockUserRepo.create).not.toHaveBeenCalled()
        })

        it('should throw error when username already exists', async () => {
            // Mock existing username
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([]) // email check
                .mockResolvedValueOnce([
                    {
                        id: 1,
                        username: 'testuser',
                        email: 'existing@example.com',
                        password: 'hashed_pass',
                        user_cuid: 'existing-cuid',
                        role_id: 1,
                    },
                ]) // username exists

            await expect(
                authService.register(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('Username and/or email already exists')

            expect(mockUserRepo.create).not.toHaveBeenCalled()
        })

        it('should throw error when both email and username exist', async () => {
            // Mock both existing
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([
                    {
                        id: 1,
                        username: 'existinguser',
                        email: 'test@example.com',
                        password: 'hashed_pass',
                        user_cuid: 'existing-cuid',
                        role_id: 1,
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        id: 2,
                        username: 'testuser',
                        email: 'existing@example.com',
                        password: 'hashed_pass',
                        user_cuid: 'existing-cuid-2',
                        role_id: 1,
                    },
                ])

            await expect(
                authService.register(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('Username and/or email already exists')

            expect(mockUserRepo.create).not.toHaveBeenCalled()
        })

        it('should throw error when user creation fails', async () => {
            // Mock no existing users
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])

            // Mock failed creation
            mockUserRepo.create.mockResolvedValue(0)

            await expect(
                authService.register(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('Failed to create user')

            expect(mockUserRepo.findOne).not.toHaveBeenCalled()
        })

        it('should throw error when created user cannot be retrieved', async () => {
            // Mock no existing users
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])

            // Mock successful creation
            mockUserRepo.create.mockResolvedValue(1)

            // Mock user not found
            mockUserRepo.findOne.mockResolvedValue(null)

            await expect(
                authService.register(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('User not retrievable')
        })
    })

    describe('login', () => {
        const validLoginData = {
            username: 'testuser',
            password: 'password123',
        }

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashed_password123',
            user_cuid: 'test-cuid-123',
            role_id: 1,
            refresh_token: '',
        }

        it('should successfully login user with correct credentials', async () => {
            // Mock user found
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([mockUser])

            // Mock successful update with refresh token
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            const result = await authService.login(
                validLoginData.username,
                validLoginData.password
            )

            expect(result.success).toBe(true)
            expect(result.user).toEqual({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 1,
                cuid: 'test-cuid-123',
            })
            expect(result.access_token).toBe('mock-jwt-token')
            expect(result.refresh_token).toBe('mock-jwt-token')

            // Verify repository calls
            expect(mockUserRepo.findRowByColumnAndValue).toHaveBeenCalledWith(
                'username',
                'testuser'
            )
            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: 'mock-jwt-token',
            })

            // Verify JWT calls
            expect(mockJwtSign).toHaveBeenCalledTimes(2) // access + refresh tokens
        })

        it('should throw error when user is not found', async () => {
            // Mock no user found
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([])

            await expect(
                authService.login(
                    validLoginData.username,
                    validLoginData.password
                )
            ).rejects.toThrow('User not found')

            expect(mockUserRepo.update).not.toHaveBeenCalled()
            expect(mockJwtSign).not.toHaveBeenCalled()
        })

        it('should throw error when password is incorrect', async () => {
            // Mock user found but with wrong password hash
            const userWithWrongPassword = {
                ...mockUser,
                password: 'hashed_wrongpassword',
            }
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([
                userWithWrongPassword,
            ])

            await expect(
                authService.login(
                    validLoginData.username,
                    validLoginData.password
                )
            ).rejects.toThrow('Password is incorrect')

            expect(mockUserRepo.update).not.toHaveBeenCalled()
            expect(mockJwtSign).not.toHaveBeenCalled()
        })

        it('should handle multiple users with same username (should use first)', async () => {
            const mockUser2 = {
                ...mockUser,
                id: 2,
                username: 'testuser',
                email: 'test2@example.com',
                password: 'hashed_password123',
                user_cuid: 'test-cuid-456',
                role_id: 1,
                refresh_token: '',
            }
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([
                mockUser,
                mockUser2,
            ])
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            const result = await authService.login(
                validLoginData.username,
                validLoginData.password
            )

            expect(result.user.id).toBe(1) // Should use first user
            expect(mockUserRepo.update).toHaveBeenCalledWith(
                1,
                expect.any(Object)
            )
        })
    })

    describe('registerAndLogin', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        }

        it('should register user and then login successfully', async () => {
            // Mock successful registration
            mockUserRepo.findRowByColumnAndValue
                .mockResolvedValueOnce([]) // email check
                .mockResolvedValueOnce([]) // username check

            mockUserRepo.create.mockResolvedValue(1)

            const mockCreatedUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                user_cuid: 'test-cuid-123',
                role_id: 1,
            }
            mockUserRepo.findOne.mockResolvedValue(mockCreatedUser)

            // Mock successful login
            const mockUserWithPassword = {
                ...mockCreatedUser,
                password: 'hashed_password123',
                refresh_token: '',
            }
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([
                mockUserWithPassword,
            ])
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            const result = await authService.registerAndLogin(
                validUserData.username,
                validUserData.email,
                validUserData.password
            )

            expect(result.success).toBe(true)
            expect(result.user.username).toBe('testuser')
            expect(result.access_token).toBe('mock-jwt-token')
            expect(result.refresh_token).toBe('mock-jwt-token')
        })

        it('should propagate registration errors', async () => {
            // Mock registration failure
            mockUserRepo.findRowByColumnAndValue.mockResolvedValueOnce([
                {
                    id: 1,
                    username: 'existinguser',
                    email: 'test@example.com',
                    password: 'hashed_pass',
                    user_cuid: 'existing-cuid',
                    role_id: 1,
                },
            ]) // email exists

            await expect(
                authService.registerAndLogin(
                    validUserData.username,
                    validUserData.email,
                    validUserData.password
                )
            ).rejects.toThrow('Username and/or email already exists')
        })
    })

    describe('logout', () => {
        it('should clear refresh token successfully', async () => {
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            await expect(authService.logout(1)).resolves.toBeUndefined()

            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: '',
            })
        })

        it('should handle update failure gracefully', async () => {
            mockUserRepo.update.mockResolvedValue({
                success: false,
                affectedRows: 0,
            })

            // logout doesn't throw on failure, just completes
            await expect(authService.logout(1)).resolves.toBeUndefined()

            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: '',
            })
        })
    })

    describe('refreshAccessToken', () => {
        const validUserCuid = 'test-cuid-123'
        const validRefreshToken = 'valid-refresh-token'

        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashed_password123',
            user_cuid: validUserCuid,
            role_id: 1,
            refresh_token: validRefreshToken,
        }

        it('should refresh tokens successfully with valid refresh token', async () => {
            // Mock user found
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([mockUser])
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            const result = await authService.refreshAccessToken(
                validUserCuid,
                validRefreshToken
            )

            expect(result.access_token).toBe('mock-jwt-token')
            expect(result.refresh_token).toBe('mock-jwt-token')
            expect(result.access_token).not.toBe(validRefreshToken)
            expect(result.refresh_token).not.toBe(validRefreshToken)

            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: 'mock-jwt-token',
            })
        })

        it('should throw error when userCuid is missing', async () => {
            await expect(
                authService.refreshAccessToken('', validRefreshToken)
            ).rejects.toThrow('Missing user CUID or refresh token')
        })

        it('should throw error when refreshToken is missing', async () => {
            await expect(
                authService.refreshAccessToken(validUserCuid, '')
            ).rejects.toThrow('Missing user CUID or refresh token')
        })

        it('should throw error when user is not found', async () => {
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([])

            await expect(
                authService.refreshAccessToken(validUserCuid, validRefreshToken)
            ).rejects.toThrow('User not found')
        })

        it('should throw error when refresh token does not match stored token', async () => {
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([mockUser])

            await expect(
                authService.refreshAccessToken(validUserCuid, 'wrong-token')
            ).rejects.toThrow('Refresh token does not match')
        })

        it('should handle JWT verification errors', async () => {
            // Mock jwt.verify to throw an error
            mockJwtVerify.mockImplementationOnce(() => {
                throw new Error('Token expired')
            })

            const userWithMatchingToken = {
                ...mockUser,
                refresh_token: 'expired-token',
            }
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([
                userWithMatchingToken,
            ])

            await expect(
                authService.refreshAccessToken(validUserCuid, 'expired-token')
            ).rejects.toThrow('Refresh token is invalid or expired')

            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: '',
            })
        })

        it('should handle multiple users with same cuid (should use first)', async () => {
            const mockUser2 = {
                ...mockUser,
                id: 2,
                username: 'testuser2',
                email: 'test2@example.com',
                user_cuid: validUserCuid,
                role_id: 1,
                refresh_token: validRefreshToken,
                password: 'hashed_password123',
            }
            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([
                mockUser,
                mockUser2,
            ])
            mockUserRepo.update.mockResolvedValue({
                success: true,
                affectedRows: 1,
            })

            const result = await authService.refreshAccessToken(
                validUserCuid,
                validRefreshToken
            )

            expect(result.access_token).toBe('mock-jwt-token')
            expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
                refresh_token: 'mock-jwt-token',
            })
        })
    })

    describe('error handling', () => {
        it('should handle repository errors gracefully', async () => {
            mockUserRepo.findRowByColumnAndValue.mockRejectedValue(
                new Error('Database connection failed')
            )

            await expect(
                authService.register(
                    'testuser',
                    'test@example.com',
                    'password123'
                )
            ).rejects.toThrow('Database connection failed')
        })

        it('should handle JWT signing errors', async () => {
            // Make jwt.sign throw an error for this test
            mockJwtSign.mockImplementationOnce(() => {
                throw new Error('JWT signing failed')
            })

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed_password123',
                user_cuid: 'test-cuid-123',
                role_id: 1,
                refresh_token: '',
            }

            mockUserRepo.findRowByColumnAndValue.mockResolvedValue([mockUser])

            await expect(
                authService.login('testuser', 'password123')
            ).rejects.toThrow('JWT signing failed')

            // Restore the mock for other tests
            mockJwtSign.mockImplementation(() => 'mock-jwt-token')
        })
    })
})
