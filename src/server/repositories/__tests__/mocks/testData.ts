// Test data fixtures for BaseRepository testing

export interface TestEntity {
    id: number
    name: string
    description?: string
    created_at: Date
    updated_at: Date
}

export const validTestColumns: (keyof TestEntity)[] = [
    'id',
    'name',
    'description',
    'created_at',
    'updated_at',
]

export const mockTestEntity: TestEntity = {
    id: 1,
    name: 'Test Entity',
    description: 'Test description',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
}

export const mockPartialEntity: Partial<TestEntity> = {
    name: 'Updated Name',
    description: 'Updated description',
}

export const mockEntityArray: TestEntity[] = [
    {
        id: 1,
        name: 'Entity 1',
        description: 'First entity',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
    },
    {
        id: 2,
        name: 'Entity 2',
        description: 'Second entity',
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-02'),
    },
]
