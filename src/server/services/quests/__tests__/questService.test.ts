// Mock external dependencies
const mockQuestRepo = {
    // Base repository methods
    getDb: jest.fn(),
    getTableName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    findRowByColumnAndValue: jest.fn(),
    findAll: jest.fn(),
    getColumns: jest.fn(),
    find: jest.fn(),

    // Quest-specific methods
    findById: jest.fn(),
    findAccessibleById: jest.fn(),
    findAccessibleByUserId: jest.fn(),
    findTaxaForQuest: jest.fn(),
    saveQuest: jest.fn(),
    updateStatus: jest.fn(),
}

const mockQuestToTaxaRepo = {
    // Base repository methods
    getDb: jest.fn(),
    getTableName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    findRowByColumnAndValue: jest.fn(),
    findAll: jest.fn(),
    getColumns: jest.fn(),
    find: jest.fn(),

    // QuestToTaxa-specific methods
    findByQuestId: jest.fn(),
    addMapping: jest.fn(),
    deleteMany: jest.fn(),
}

const mockQuestShareRepo = {
    // Base repository methods
    getDb: jest.fn(),
    getTableName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    findRowByColumnAndValue: jest.fn(),
    findAll: jest.fn(),
    getColumns: jest.fn(),
    find: jest.fn(),

    // QuestShare-specific methods
    findById: jest.fn(),
    findByToken: jest.fn(),
    findActiveByToken: jest.fn(),
    findByQuestId: jest.fn(),
    createShare: jest.fn(),
    deleteShare: jest.fn(),
}

const mockINatService = {
    getTaxonPhoto: jest.fn(),
}

const mockSendEvent = jest.fn()

// Mock the modules
jest.mock('../../../repositories/QuestRepository.js', () => ({
    createQuestRepository: jest.fn(() => mockQuestRepo),
    createQuestToTaxaRepository: jest.fn(() => mockQuestToTaxaRepo),
}))

jest.mock('../../../repositories/QuestShareRepository.js', () => ({
    createQuestShareRepository: jest.fn(() => mockQuestShareRepo),
}))

jest.mock('../../iNatService.js', () => ({
    iNatService: mockINatService,
}))

jest.mock('../questEventsService.js', () => ({
    sendEvent: mockSendEvent,
}))

import { createQuestService } from '../questService.js'
import { QuestWithTaxa } from '../../../repositories/QuestRepository.js'
import { Quest } from '../../../models/quests.js'

describe('QuestService', () => {
    let questService: ReturnType<typeof createQuestService>

    beforeEach(() => {
        jest.clearAllMocks()

        // Create service with mocked dependencies
        questService = createQuestService(
            mockQuestRepo,
            mockQuestToTaxaRepo,
            mockQuestShareRepo
        )
    })

    describe('createQuest', () => {
        const validQuestData: Partial<QuestWithTaxa> = {
            name: 'Test Quest',
            description: 'A test quest for biodiversity',
            is_private: false,
            location_name: 'Central Park',
            latitude: 40.7829,
            longitude: -73.9654,
            starts_at: new Date('2024-01-01T00:00:00Z'),
            ends_at: new Date('2024-12-31T23:59:59Z'),
            taxon_ids: [123, 456, 789],
        }

        const userId = 42

        it('should create quest with basic data successfully', async () => {
            // Mock successful quest creation
            mockQuestRepo.create.mockResolvedValue(1)

            // Mock finding the created quest
            const mockCreatedQuest = {
                id: 1,
                name: 'Test Quest',
                description: 'A test quest for biodiversity',
                is_private: false,
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                location_name: 'Central Park',
                latitude: 40.7829,
                longitude: -73.9654,
                starts_at: new Date('2024-01-01T00:00:00Z'),
                ends_at: new Date('2024-12-31T23:59:59Z'),
                created_at: new Date(),
                updated_at: new Date(),
            }
            mockQuestRepo.findById.mockResolvedValue(mockCreatedQuest)

            // Mock taxa retrieval for the created quest
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: 456 },
                { id: 3, quest_id: 1, taxon_id: 789 },
            ])

            // Mock taxa creation
            mockQuestToTaxaRepo.create
                .mockResolvedValueOnce(1) // taxon 123
                .mockResolvedValueOnce(2) // taxon 456
                .mockResolvedValueOnce(3) // taxon 789

            // Mock quest share creation
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            const result = await questService.createQuest(
                validQuestData,
                userId
            )

            // Verify quest creation
            expect(mockQuestRepo.create).toHaveBeenCalledWith({
                name: 'Test Quest',
                description: 'A test quest for biodiversity',
                is_private: false,
                location_name: 'Central Park',
                latitude: 40.7829,
                longitude: -73.9654,
                starts_at: new Date('2024-01-01T00:00:00Z'),
                ends_at: new Date('2024-12-31T23:59:59Z'),
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
            })

            // Verify taxa mappings creation
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledTimes(3)
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: 1,
                taxon_id: 123,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: 1,
                taxon_id: 456,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: 1,
                taxon_id: 789,
            })

            // Verify quest share creation
            expect(mockQuestShareRepo.createShare).toHaveBeenCalledWith({
                quest_id: 1,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
            })

            // Verify result structure
            expect(result).toEqual({
                ...mockCreatedQuest,
                taxon_ids: [123, 456, 789], // Should match the taxa we mocked
            })
        })

        it('should create quest with minimal data', async () => {
            const minimalQuestData: Partial<QuestWithTaxa> = {
                name: 'Minimal Quest',
            }

            mockQuestRepo.create.mockResolvedValue(2)
            mockQuestRepo.findById.mockResolvedValue({
                id: 2,
                name: 'Minimal Quest',
                is_private: false,
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            })
            mockQuestToTaxaRepo.findMany.mockResolvedValue([]) // No taxa for minimal quest
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            const result = await questService.createQuest(
                minimalQuestData,
                userId
            )

            expect(mockQuestRepo.create).toHaveBeenCalledWith({
                name: 'Minimal Quest',
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                starts_at: null,
                ends_at: null,
            })
            expect(result.name).toBe('Minimal Quest')
        })

        it('should handle empty taxon_ids array', async () => {
            const questDataWithoutTaxa = {
                ...validQuestData,
                taxon_ids: [],
            }

            mockQuestRepo.create.mockResolvedValue(3)
            mockQuestRepo.findById.mockResolvedValue({
                id: 3,
                name: 'Test Quest',
                is_private: false,
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            })
            mockQuestToTaxaRepo.findMany.mockResolvedValue([]) // Empty taxa array
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            await questService.createQuest(questDataWithoutTaxa, userId)

            // Should not create any taxa mappings
            expect(mockQuestToTaxaRepo.create).not.toHaveBeenCalled()
        })

        it('should handle undefined taxon_ids', async () => {
            const questDataWithoutTaxa = {
                ...validQuestData,
                taxon_ids: undefined,
            }

            mockQuestRepo.create.mockResolvedValue(4)
            mockQuestRepo.findById.mockResolvedValue({
                id: 4,
                name: 'Test Quest',
                is_private: false,
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            })
            mockQuestToTaxaRepo.findMany.mockResolvedValue([]) // Undefined taxa becomes empty
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            await questService.createQuest(questDataWithoutTaxa, userId)

            // Should not create any taxa mappings
            expect(mockQuestToTaxaRepo.create).not.toHaveBeenCalled()
        })

        it('should set default mode to cooperative', async () => {
            const questDataWithoutMode = {
                name: 'Test Quest',
                mode: undefined, // Explicitly undefined
            }

            mockQuestRepo.create.mockResolvedValue(5)
            mockQuestRepo.findById.mockResolvedValue({
                id: 5,
                name: 'Test Quest',
                mode: 'cooperative', // Should be set to default
                is_private: false,
                user_id: userId,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date(),
            })
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            await questService.createQuest(questDataWithoutMode, userId)

            expect(mockQuestRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    mode: 'cooperative',
                })
            )
        })

        it('should handle date parsing correctly', async () => {
            const questDataWithDates = {
                name: 'Date Test Quest',
                starts_at: new Date('2024-06-15T10:30:00Z'),
                ends_at: new Date('2024-06-16T10:30:00Z'),
            }

            mockQuestRepo.create.mockResolvedValue(6)
            mockQuestRepo.findById.mockResolvedValue({
                id: 6,
                name: 'Date Test Quest',
                starts_at: new Date('2024-06-15T10:30:00Z'),
                ends_at: new Date('2024-06-16T10:30:00Z'),
                is_private: false,
                user_id: userId,
                status: 'pending',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            })
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])
            mockQuestShareRepo.createShare.mockResolvedValue(1)

            await questService.createQuest(questDataWithDates, userId)

            expect(mockQuestRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    starts_at: new Date('2024-06-15T10:30:00Z'),
                    ends_at: new Date('2024-06-16T10:30:00Z'),
                })
            )
        })

        it('should throw error when quest creation fails', async () => {
            // Mock quest creation to throw an error (more realistic failure)
            mockQuestRepo.create.mockRejectedValue(
                new Error('Database connection failed')
            )

            await expect(
                questService.createQuest(validQuestData, userId)
            ).rejects.toThrow('Failed to create quest')

            // Verify that subsequent operations were not attempted
            expect(mockQuestToTaxaRepo.create).not.toHaveBeenCalled()
            expect(mockQuestShareRepo.createShare).not.toHaveBeenCalled()
            expect(mockQuestRepo.findById).not.toHaveBeenCalled()
        })
    })

    describe('updateQuest', () => {
        const existingQuestId = 1
        const ownerId = 42
        const nonOwnerId = 999

        const existingQuest = {
            id: existingQuestId,
            name: 'Original Quest',
            description: 'Original description',
            is_private: false,
            user_id: ownerId,
            status: 'pending',
            mode: 'cooperative',
            location_name: 'Original Location',
            latitude: 40.7128,
            longitude: -74.006,
            starts_at: new Date('2024-01-01T00:00:00Z'),
            ends_at: new Date('2024-12-31T23:59:59Z'),
            created_at: new Date(),
            updated_at: new Date(),
        }

        beforeEach(() => {
            // Reset mocks
            mockQuestRepo.findById.mockResolvedValue(existingQuest)
            mockQuestRepo.update.mockResolvedValue(undefined)
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])
            mockQuestToTaxaRepo.deleteMany.mockResolvedValue(undefined)
            mockQuestToTaxaRepo.create.mockResolvedValue(1)
        })

        it('should successfully update quest when user is owner', async () => {
            const updateData: Partial<QuestWithTaxa> = {
                name: 'Updated Quest Name',
                description: 'Updated description',
                location_name: 'Updated Location',
                taxon_ids: [111, 222],
            }

            // Mock successful update
            const updatedQuest = {
                ...existingQuest,
                ...updateData,
            }
            mockQuestRepo.findById.mockResolvedValue(updatedQuest)

            // Mock taxa retrieval to return the updated taxa
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: existingQuestId, taxon_id: 111 },
                { id: 2, quest_id: existingQuestId, taxon_id: 222 },
            ])

            const result = await questService.updateQuest(
                existingQuestId,
                updateData,
                ownerId
            )

            // Verify quest update was called
            expect(mockQuestRepo.update).toHaveBeenCalledWith(existingQuestId, {
                name: 'Updated Quest Name',
                description: 'Updated description',
                location_name: 'Updated Location',
                starts_at: undefined,
                ends_at: undefined,
            })

            // Verify taxa operations
            expect(mockQuestToTaxaRepo.deleteMany).toHaveBeenCalledWith({
                quest_id: existingQuestId,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledTimes(2)
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: existingQuestId,
                taxon_id: 111,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: existingQuestId,
                taxon_id: 222,
            })

            // Verify result
            expect(result.name).toBe('Updated Quest Name')
            expect(result.taxon_ids).toEqual([111, 222])
        })

        it('should handle partial updates correctly', async () => {
            const partialUpdate: Partial<QuestWithTaxa> = {
                description: 'Only updating description',
            }

            const _result = await questService.updateQuest(
                existingQuestId,
                partialUpdate,
                ownerId
            )

            // Should only update the description field
            expect(mockQuestRepo.update).toHaveBeenCalledWith(existingQuestId, {
                description: 'Only updating description',
                starts_at: undefined,
                ends_at: undefined,
            })

            // Should not touch taxa since none provided
            expect(mockQuestToTaxaRepo.deleteMany).not.toHaveBeenCalled()
            expect(mockQuestToTaxaRepo.create).not.toHaveBeenCalled()
        })

        it('should handle date updates correctly', async () => {
            const dateUpdate: Partial<QuestWithTaxa> = {
                starts_at: new Date('2024-06-01T00:00:00Z'),
                ends_at: new Date('2024-06-30T23:59:59Z'),
            }

            await questService.updateQuest(existingQuestId, dateUpdate, ownerId)

            expect(mockQuestRepo.update).toHaveBeenCalledWith(existingQuestId, {
                starts_at: new Date('2024-06-01T00:00:00Z'),
                ends_at: new Date('2024-06-30T23:59:59Z'),
            })
        })

        it('should replace taxa when new taxa_ids provided', async () => {
            // Existing taxa
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: existingQuestId, taxon_id: 999 },
                { id: 2, quest_id: existingQuestId, taxon_id: 888 },
            ])

            const taxaUpdate: Partial<QuestWithTaxa> = {
                taxon_ids: [111, 222, 333], // New taxa
            }

            await questService.updateQuest(existingQuestId, taxaUpdate, ownerId)

            // Should delete existing taxa
            expect(mockQuestToTaxaRepo.deleteMany).toHaveBeenCalledWith({
                quest_id: existingQuestId,
            })

            // Should create new taxa
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledTimes(3)
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: existingQuestId,
                taxon_id: 111,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: existingQuestId,
                taxon_id: 222,
            })
            expect(mockQuestToTaxaRepo.create).toHaveBeenCalledWith({
                quest_id: existingQuestId,
                taxon_id: 333,
            })
        })

        it('should throw error when quest not found', async () => {
            mockQuestRepo.findById.mockResolvedValue(null)

            await expect(
                questService.updateQuest(999, { name: 'Test' }, ownerId)
            ).rejects.toThrow('Quest not found')
        })

        it('should throw error when user is not owner', async () => {
            await expect(
                questService.updateQuest(
                    existingQuestId,
                    { name: 'Test' },
                    nonOwnerId
                )
            ).rejects.toThrow('Access denied')
        })

        it('should handle empty updates gracefully', async () => {
            const emptyUpdate: Partial<QuestWithTaxa> = {}

            await questService.updateQuest(
                existingQuestId,
                emptyUpdate,
                ownerId
            )

            // Should not call update with empty data
            expect(mockQuestRepo.update).toHaveBeenCalledWith(existingQuestId, {
                starts_at: undefined,
                ends_at: undefined,
            })
        })

        it('should handle taxa removal (empty array)', async () => {
            const taxaRemoval: Partial<QuestWithTaxa> = {
                taxon_ids: [], // Remove all taxa
            }

            await questService.updateQuest(
                existingQuestId,
                taxaRemoval,
                ownerId
            )

            // Should delete existing taxa but not create new ones
            expect(mockQuestToTaxaRepo.deleteMany).toHaveBeenCalledWith({
                quest_id: existingQuestId,
            })
            expect(mockQuestToTaxaRepo.create).not.toHaveBeenCalled()
        })
    })

    describe('getAllPublicQuests', () => {
        const mockQuests = [
            {
                id: 1,
                name: 'Public Quest 1',
                description: 'First public quest',
                is_private: false,
                user_id: 10,
                status: 'active',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Public Quest 2',
                description: 'Second public quest',
                is_private: false,
                user_id: 20,
                status: 'pending',
                mode: 'competitive',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]

        beforeEach(() => {
            // Reset mocks
            mockQuestRepo.findMany.mockResolvedValue(mockQuests)
            mockQuestToTaxaRepo.findMany.mockImplementation((conditions) => {
                if (conditions.quest_id === 1) {
                    return Promise.resolve([
                        { id: 1, quest_id: 1, taxon_id: 123 },
                        { id: 2, quest_id: 1, taxon_id: 456 },
                    ])
                }
                if (conditions.quest_id === 2) {
                    return Promise.resolve([
                        { id: 3, quest_id: 2, taxon_id: 789 },
                    ])
                }
                return Promise.resolve([])
            })
            mockINatService.getTaxonPhoto.mockResolvedValue(
                'https://example.com/photo.jpg'
            )
        })

        it('should retrieve public quests with pagination', async () => {
            const result = await questService.getAllPublicQuests(1, 10)

            expect(mockQuestRepo.findMany).toHaveBeenCalledWith(
                { is_private: false },
                { limit: 10, offset: 0 }
            )

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                id: 1,
                name: 'Public Quest 1',
                taxon_ids: [123, 456],
                photoUrl: 'https://example.com/photo.jpg',
            })
            expect(result[1]).toMatchObject({
                id: 2,
                name: 'Public Quest 2',
                taxon_ids: [789],
                photoUrl: 'https://example.com/photo.jpg',
            })
        })

        it('should handle pagination correctly', async () => {
            await questService.getAllPublicQuests(2, 5)

            expect(mockQuestRepo.findMany).toHaveBeenCalledWith(
                { is_private: false },
                { limit: 5, offset: 5 }
            )
        })

        it('should handle quests without taxa', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])

            const result = await questService.getAllPublicQuests()

            expect(result[0].taxon_ids).toEqual([])
            expect(result[1].taxon_ids).toEqual([])
        })

        it('should handle photo fetch failures by throwing error', async () => {
            mockINatService.getTaxonPhoto.mockRejectedValue(
                new Error('API unavailable')
            )

            // Currently the function throws when photo fetch fails
            await expect(questService.getAllPublicQuests()).rejects.toThrow(
                'Failed to retrieve public quests'
            )
        })

        it('should handle empty quest results', async () => {
            mockQuestRepo.findMany.mockResolvedValue([])

            const result = await questService.getAllPublicQuests()

            expect(result).toEqual([])
        })

        it('should filter out invalid taxon IDs', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: null }, // Invalid
                { id: 3, quest_id: 1, taxon_id: 0 }, // Invalid
                { id: 4, quest_id: 1, taxon_id: 456 },
            ])

            const result = await questService.getAllPublicQuests()

            expect(result[0].taxon_ids).toEqual([123, 456])
        })

        it('should handle repository errors', async () => {
            mockQuestRepo.findMany.mockRejectedValue(
                new Error('Database error')
            )

            await expect(questService.getAllPublicQuests()).rejects.toThrow(
                'Failed to retrieve public quests'
            )
        })

        it('should use first taxon ID for photo fetching', async () => {
            const _result = await questService.getAllPublicQuests()

            // Should fetch photo for first taxon of each quest
            expect(mockINatService.getTaxonPhoto).toHaveBeenCalledWith(123) // First taxon of quest 1
            expect(mockINatService.getTaxonPhoto).toHaveBeenCalledWith(789) // First taxon of quest 2
        })

        it('should handle quests with no valid taxa for photos', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: 1, taxon_id: null },
                { id: 2, quest_id: 1, taxon_id: 0 },
            ])

            const result = await questService.getAllPublicQuests()

            expect(result[0].photoUrl).toBeNull()
            expect(mockINatService.getTaxonPhoto).not.toHaveBeenCalled()
        })
    })

    describe('getUserQuests', () => {
        const targetUserId = 42
        const _viewerId = 99
        const differentViewerId = 100

        const mockUserQuests = [
            {
                id: 1,
                name: 'Public Quest',
                description: 'A public quest',
                is_private: false,
                user_id: targetUserId,
                status: 'active',
                mode: 'cooperative',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Private Quest',
                description: 'A private quest',
                is_private: true,
                user_id: targetUserId,
                status: 'pending',
                mode: 'competitive',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]

        beforeEach(() => {
            // Reset mocks
            mockQuestRepo.findAccessibleByUserId.mockResolvedValue(
                mockUserQuests
            )
            mockQuestToTaxaRepo.findMany.mockImplementation((conditions) => {
                if (conditions.quest_id === 1) {
                    return Promise.resolve([
                        { id: 1, quest_id: 1, taxon_id: 123 },
                    ])
                }
                if (conditions.quest_id === 2) {
                    return Promise.resolve([
                        { id: 2, quest_id: 2, taxon_id: 456 },
                        { id: 3, quest_id: 2, taxon_id: 789 },
                    ])
                }
                return Promise.resolve([])
            })
            mockINatService.getTaxonPhoto.mockResolvedValue(
                'https://example.com/photo.jpg'
            )
        })

        it('should return all quests when viewer is the owner', async () => {
            // viewerId === targetUserId means viewer is the owner
            const result = await questService.getUserQuests(
                targetUserId,
                targetUserId,
                1,
                10
            )

            expect(mockQuestRepo.findAccessibleByUserId).toHaveBeenCalledWith(
                targetUserId,
                targetUserId,
                10,
                0
            )

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                id: 1,
                name: 'Public Quest',
                is_private: false,
                taxon_ids: [123],
                photoUrl: 'https://example.com/photo.jpg',
            })
            expect(result[1]).toMatchObject({
                id: 2,
                name: 'Private Quest',
                is_private: true,
                taxon_ids: [456, 789],
                photoUrl: 'https://example.com/photo.jpg',
            })
        })

        it('should return only public quests when viewer is not the owner', async () => {
            // Mock repository to return only public quests for non-owner
            const publicQuestsOnly = [mockUserQuests[0]] // Only the public quest
            mockQuestRepo.findAccessibleByUserId.mockResolvedValue(
                publicQuestsOnly
            )

            const result = await questService.getUserQuests(
                targetUserId,
                differentViewerId,
                1,
                10
            )

            expect(mockQuestRepo.findAccessibleByUserId).toHaveBeenCalledWith(
                targetUserId,
                differentViewerId,
                10,
                0
            )

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                id: 1,
                name: 'Public Quest',
                is_private: false,
            })
        })

        it('should return only public quests when no viewer specified', async () => {
            // Mock repository to return only public quests
            const publicQuestsOnly = [mockUserQuests[0]]
            mockQuestRepo.findAccessibleByUserId.mockResolvedValue(
                publicQuestsOnly
            )

            const result = await questService.getUserQuests(
                targetUserId,
                undefined,
                1,
                10
            )

            expect(mockQuestRepo.findAccessibleByUserId).toHaveBeenCalledWith(
                targetUserId,
                undefined,
                10,
                0
            )

            expect(result).toHaveLength(1)
            expect(result[0].is_private).toBe(false)
        })

        it('should handle pagination correctly', async () => {
            await questService.getUserQuests(targetUserId, targetUserId, 2, 5)

            expect(mockQuestRepo.findAccessibleByUserId).toHaveBeenCalledWith(
                targetUserId,
                targetUserId,
                5, // limit
                5 // offset = (page - 1) * limit
            )
        })

        it('should use default pagination values', async () => {
            await questService.getUserQuests(targetUserId, targetUserId)

            expect(mockQuestRepo.findAccessibleByUserId).toHaveBeenCalledWith(
                targetUserId,
                targetUserId,
                10, // default limit
                0 // default offset
            )
        })

        it('should handle quests without taxa', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])

            const result = await questService.getUserQuests(
                targetUserId,
                targetUserId
            )

            expect(result[0].taxon_ids).toEqual([])
            expect(result[1].taxon_ids).toEqual([])
        })

        it('should handle empty quest results', async () => {
            mockQuestRepo.findAccessibleByUserId.mockResolvedValue([])

            const result = await questService.getUserQuests(
                targetUserId,
                targetUserId
            )

            expect(result).toEqual([])
        })

        it('should filter out invalid taxon IDs', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: null }, // Invalid
                { id: 3, quest_id: 1, taxon_id: 0 }, // Invalid
                { id: 4, quest_id: 1, taxon_id: 456 },
            ])

            const result = await questService.getUserQuests(
                targetUserId,
                targetUserId
            )

            expect(result[0].taxon_ids).toEqual([123, 456])
        })

        it('should handle photo fetch failures gracefully', async () => {
            mockINatService.getTaxonPhoto.mockRejectedValue(
                new Error('API unavailable')
            )

            // This should throw because of Promise.all failure (same as getAllPublicQuests)
            await expect(
                questService.getUserQuests(targetUserId, targetUserId)
            ).rejects.toThrow('Failed to retrieve user quests')
        })

        it('should handle repository errors', async () => {
            mockQuestRepo.findAccessibleByUserId.mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                questService.getUserQuests(targetUserId, targetUserId)
            ).rejects.toThrow('Failed to retrieve user quests')
        })

        it('should process taxa and photos for each quest', async () => {
            const result = await questService.getUserQuests(
                targetUserId,
                targetUserId
            )

            // Should have processed taxa for both quests
            expect(result[0].taxon_ids).toEqual([123])
            expect(result[1].taxon_ids).toEqual([456, 789])

            // Should have fetched photos for first taxon of each quest
            expect(mockINatService.getTaxonPhoto).toHaveBeenCalledWith(123)
            expect(mockINatService.getTaxonPhoto).toHaveBeenCalledWith(456)
        })
    })

    describe('getAccessibleQuestById', () => {
        const mockQuest: Quest = {
            id: 1,
            name: 'Test Quest',
            created_at: new Date(),
            updated_at: new Date(),
            starts_at: null,
            ends_at: null,
            description: 'Test description',
            is_private: false,
            user_id: 1,
            status: 'active',
            location_name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.006,
            mode: 'cooperative',
        }

        it('should allow owner to access private quest', async () => {
            const privateQuest = { ...mockQuest, is_private: true }
            mockQuestRepo.findAccessibleById.mockResolvedValue(privateQuest)

            const result = await questService.getAccessibleQuestById(1, 1)

            expect(result).toEqual(privateQuest)
            expect(mockQuestRepo.findAccessibleById).toHaveBeenCalledWith(1, 1)
        })

        it('should deny non-owner from accessing private quest', async () => {
            mockQuestRepo.findAccessibleById.mockResolvedValue(null)

            await expect(
                questService.getAccessibleQuestById(1, 2)
            ).rejects.toThrow('Quest not found or access denied')
        })

        it('should allow anyone to access public quest', async () => {
            mockQuestRepo.findAccessibleById.mockResolvedValue(mockQuest)

            const result = await questService.getAccessibleQuestById(1, 2)

            expect(result).toEqual(mockQuest)
        })

        it('should handle non-existent quest', async () => {
            mockQuestRepo.findAccessibleById.mockResolvedValue(null)

            await expect(
                questService.getAccessibleQuestById(999, 1)
            ).rejects.toThrow('Quest not found or access denied')
        })
    })

    describe('updateQuestStatus', () => {
        const existingQuest: Quest = {
            id: 1,
            name: 'Test Quest',
            created_at: new Date(),
            updated_at: new Date(),
            starts_at: null,
            ends_at: null,
            description: 'Test description',
            is_private: false,
            user_id: 1,
            status: 'pending',
            location_name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.006,
            mode: 'cooperative',
        }

        it('should allow valid status transitions', async () => {
            mockQuestRepo.findById.mockResolvedValue(existingQuest)
            mockQuestRepo.updateStatus.mockResolvedValue(undefined)

            await questService.updateQuestStatus(1, 'active', 1)

            expect(mockQuestRepo.updateStatus).toHaveBeenCalledWith(1, 'active')
        })

        it('should reject invalid status', async () => {
            mockQuestRepo.findById.mockResolvedValue(existingQuest)

            await expect(
                questService.updateQuestStatus(1, 'invalid' as any, 1)
            ).rejects.toThrow('Invalid status')
        })

        it('should validate permission', async () => {
            mockQuestRepo.findById.mockResolvedValue(existingQuest)

            await expect(
                questService.updateQuestStatus(1, 'active', 2)
            ).rejects.toThrow('Access denied')
        })

        it('should broadcast event on status update', async () => {
            mockQuestRepo.findById.mockResolvedValue(existingQuest)
            mockQuestRepo.updateStatus.mockResolvedValue(undefined)

            await questService.updateQuestStatus(1, 'active', 1)

            expect(mockSendEvent).toHaveBeenCalledWith('1', {
                type: 'QUEST_STATUS_UPDATED',
                payload: { status: 'active' },
            })
        })

        it('should handle non-existent quest', async () => {
            mockQuestRepo.findById.mockResolvedValue(null)

            await expect(
                questService.updateQuestStatus(1, 'active', 1)
            ).rejects.toThrow('Quest not found')
        })
    })

    describe('getQuestWithTaxaById', () => {
        const mockQuest: Quest = {
            id: 1,
            name: 'Test Quest',
            created_at: new Date(),
            updated_at: new Date(),
            starts_at: null,
            ends_at: null,
            description: 'Test description',
            is_private: false,
            user_id: 1,
            status: 'active',
            location_name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.006,
            mode: 'cooperative',
        }

        it('should return quest with taxa mappings', async () => {
            const mockTaxa = [
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: 456 },
            ]

            mockQuestRepo.findById.mockResolvedValue(mockQuest)
            mockQuestToTaxaRepo.findMany.mockResolvedValue(mockTaxa)

            const result = await questService.getQuestWithTaxaById(1)

            expect(result).toEqual({
                ...mockQuest,
                taxon_ids: [123, 456],
            })
        })

        it('should filter out invalid taxon IDs', async () => {
            const mockTaxa = [
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: null },
                { id: 3, quest_id: 1, taxon_id: 0 },
            ]

            mockQuestRepo.findById.mockResolvedValue(mockQuest)
            mockQuestToTaxaRepo.findMany.mockResolvedValue(mockTaxa)

            const result = await questService.getQuestWithTaxaById(1)

            expect(result.taxon_ids).toEqual([123])
        })

        it('should throw error when quest not found', async () => {
            mockQuestRepo.findById.mockResolvedValue(null)

            await expect(
                questService.getQuestWithTaxaById(999)
            ).rejects.toThrow('Quest not found')
        })
    })

    describe('getTaxaForQuestId', () => {
        it('should return taxa mappings for quest', async () => {
            const mockTaxa = [
                { id: 1, quest_id: 1, taxon_id: 123 },
                { id: 2, quest_id: 1, taxon_id: 456 },
            ]

            mockQuestToTaxaRepo.findMany.mockResolvedValue(mockTaxa)

            const result = await questService.getTaxaForQuestId(1)

            expect(mockQuestToTaxaRepo.findMany).toHaveBeenCalledWith({
                quest_id: 1,
            })
            expect(result).toEqual(mockTaxa)
        })

        it('should handle empty taxa results', async () => {
            mockQuestToTaxaRepo.findMany.mockResolvedValue([])

            const result = await questService.getTaxaForQuestId(1)

            expect(result).toEqual([])
        })
    })

    describe('getAccessibleQuestWithTaxaById', () => {
        const mockQuest: Quest = {
            id: 1,
            name: 'Test Quest',
            created_at: new Date(),
            updated_at: new Date(),
            starts_at: null,
            ends_at: null,
            description: 'Test description',
            is_private: false,
            user_id: 1,
            status: 'active',
            location_name: 'Test Location',
            latitude: 40.7128,
            longitude: -74.006,
            mode: 'cooperative',
        }

        it('should return quest with taxa when user has access', async () => {
            const mockQuestWithTaxa = {
                ...mockQuest,
                taxon_ids: [123],
            }
            mockQuestRepo.findAccessibleById.mockResolvedValue(
                mockQuestWithTaxa
            )

            const result = await questService.getAccessibleQuestWithTaxaById(
                1,
                1
            )

            expect(result).toEqual(mockQuestWithTaxa)
        })

        it('should throw error when quest not accessible', async () => {
            mockQuestRepo.findAccessibleById.mockResolvedValue(null)

            await expect(
                questService.getAccessibleQuestWithTaxaById(1, 2)
            ).rejects.toThrow('Quest not found or access denied')
        })
    })

    describe('error handling', () => {
        it('should handle repository errors in getAllPublicQuests', async () => {
            mockQuestRepo.findMany.mockRejectedValue(
                new Error('Database error')
            )

            await expect(questService.getAllPublicQuests()).rejects.toThrow(
                'Failed to retrieve public quests'
            )
        })

        it('should handle repository errors in createQuest', async () => {
            mockQuestRepo.create.mockRejectedValue(new Error('Database error'))

            await expect(
                questService.createQuest({ name: 'Test', is_private: false }, 1)
            ).rejects.toThrow('Failed to create quest')
        })

        it('should handle repository errors in updateQuest', async () => {
            mockQuestRepo.findById.mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                questService.updateQuest(1, { name: 'Updated' }, 1)
            ).rejects.toThrow('Database error')
        })

        it('should handle repository errors in getUserQuests', async () => {
            mockQuestRepo.findAccessibleByUserId.mockRejectedValue(
                new Error('Database error')
            )

            await expect(questService.getUserQuests(1, 1)).rejects.toThrow(
                'Failed to retrieve user quests'
            )
        })

        it('should handle quest not found in getQuestWithTaxaById', async () => {
            mockQuestRepo.findById.mockResolvedValue(null)

            await expect(
                questService.getQuestWithTaxaById(999)
            ).rejects.toThrow('Quest not found')
        })

        it('should handle iNat API errors by throwing', async () => {
            const mockQuest: Quest = {
                id: 1,
                name: 'Test Quest',
                created_at: new Date(),
                updated_at: new Date(),
                starts_at: null,
                ends_at: null,
                description: 'Test description',
                is_private: false,
                user_id: 1,
                status: 'active',
                location_name: 'Test Location',
                latitude: 40.7128,
                longitude: -74.006,
                mode: 'cooperative',
            }

            mockQuestRepo.findMany.mockResolvedValue([mockQuest])
            mockQuestToTaxaRepo.findMany.mockResolvedValue([
                { id: 1, quest_id: 1, taxon_id: 123 },
            ])
            mockINatService.getTaxonPhoto.mockRejectedValue(
                new Error('API timeout')
            )

            await expect(questService.getAllPublicQuests()).rejects.toThrow(
                'Failed to retrieve public quests'
            )
        })

        it('should handle taxa creation failures', async () => {
            mockQuestRepo.create.mockResolvedValue(1)
            mockQuestShareRepo.createShare.mockResolvedValue(1)
            mockQuestToTaxaRepo.create.mockRejectedValue(
                new Error('Taxa creation failed')
            )

            await expect(
                questService.createQuest(
                    { name: 'Test', is_private: false, taxon_ids: [123] },
                    1
                )
            ).rejects.toThrow('Failed to create quest')
        })

        it('should handle quest share creation failures', async () => {
            mockQuestRepo.create.mockResolvedValue(1)
            mockQuestShareRepo.createShare.mockRejectedValue(
                new Error('Share creation failed')
            )

            await expect(
                questService.createQuest({ name: 'Test', is_private: false }, 1)
            ).rejects.toThrow('Failed to create quest')
        })
    })
})
