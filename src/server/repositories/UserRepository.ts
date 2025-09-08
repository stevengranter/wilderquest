import { type Pool, type RowDataPacket } from 'mysql2/promise'
import { createBaseRepository } from './BaseRepository.js'
import { z } from 'zod'

export type User = z.infer<typeof UserSchema>;

export const UserSchema = z.object({
    id: z.number().int().min(1),
    username: z.string().min(2).max(30),
    email: z.string().email(),
    password: z.string().min(8),
    user_cuid: z.string().cuid2(),
    created_at: z.instanceof(Date).optional(),
    updated_at: z.instanceof(Date).optional(),
    role_id: z.number().int().min(1),
    refresh_token: z.string().jwt().nullish(),
})

export const SafeUserSchema = UserSchema.pick({
    id: true,
    username: true,
    created_at: true,
    updated_at: true,
})

export interface SafeUserDTO extends z.infer<typeof SafeUserSchema> {
}

// Explicitly list only the safe columns
export const safeUserColumns = [
    'id',
    'username',
    'created_at',
    'updated_at',
] as const satisfies (keyof SafeUserDTO)[]

export type UserRepository = ReturnType<typeof createUserRepository>

export function createUserRepository(
    tableName: string,
    dbPool: Pool,
    validColumns: (keyof User)[]
) {
    const base = createBaseRepository<User>(tableName, dbPool, validColumns)

    async function create(data: Partial<User>): Promise<number> {
        const now = new Date()
        return base.create({
            ...data,
            created_at: now,
            updated_at: now,
        })
    }

    async function findUserForDisplay(
        conditions: Partial<User>
    ): Promise<Partial<SafeUserDTO> | null> {
        return base.findOne(conditions, safeUserColumns)
    }

    // Find multiple users for admin operations (returns full user data)
    async function findUsersForAdmin(
        conditions: Partial<User> = {},
        options: {
            limit?: number
            offset?: number
            orderByColumn?: keyof User
            order?: 'asc' | 'desc'
        } = {}
    ): Promise<User[]> {
        return base.find(conditions, options)
    }

    // Search users by username (partial match)
    async function searchUsersByUsername(
        query: string,
        options: {
            limit?: number
            offset?: number
            excludeUserId?: number
        } = {}
    ): Promise<{ users: SafeUserDTO[]; total: number }> {
        const { limit = 20, offset = 0, excludeUserId } = options
        const db = base.getDb()

        // Build WHERE clause
        let whereClause = 'username LIKE ?'
        const params: (string | number)[] = [`%${query}%`]

        if (excludeUserId) {
            whereClause += ' AND id != ?'
            params.push(excludeUserId)
        }

        // Get total count
        const [countResult] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
            params
        )
        const total = (countResult as { total: number }[])[0].total

        // Get users with pagination
        const [userResults] = await db.execute<RowDataPacket[]>(
            `SELECT ${safeUserColumns.join(', ')} FROM users
             WHERE ${whereClause}
             ORDER BY username ASC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        )

        const users = userResults as SafeUserDTO[]

        return { users, total }
    }

    // Get user stats: total quests participated, active quests, taxa found
    async function getUserStats(userId: number): Promise<{
        totalQuestsParticipated: number
        activeQuests: number
        taxaFound: number
    }> {
        const db = base.getDb()

        // Count owned quests
        const [ownedQuestsResult] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM quests WHERE user_id = ?',
            [userId]
        )
        const ownedQuestsCount = (ownedQuestsResult as { count: number }[])[0]
            .count

        // Count shared quests (where user is a participant via quest_shares)
        const [sharedQuestsResult] = await db.execute<RowDataPacket[]>(
            'SELECT COUNT(DISTINCT qs.quest_id) as count FROM quest_shares qs WHERE qs.created_by_user_id = ?',
            [userId]
        )
        const sharedQuestsCount = (sharedQuestsResult as { count: number }[])[0]
            .count

        // Count active quests (owned + shared that are active)
        const [activeQuestsResult] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT q.id) as count
             FROM quests q
             LEFT JOIN quest_shares qs ON q.id = qs.quest_id
             WHERE (q.user_id = ? OR qs.created_by_user_id = ?)
             AND q.status = 'active'`,
            [userId, userId]
        )
        const activeQuestsCount = (activeQuestsResult as { count: number }[])[0]
            .count

        // Count unique taxa from collections
        const [collectionsTaxaResult] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT ct.taxon_id) as count
             FROM collections_to_taxa ct
             JOIN collections c ON ct.collection_id = c.id
             WHERE c.user_id = ?`,
            [userId]
        )
        const collectionsTaxaCount = (
            collectionsTaxaResult as { count: number }[]
        )[0].count

        // Count unique taxa from quest progress
        const [questProgressTaxaResult] = await db.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT sqp.taxon_id) as count
             FROM shared_quest_progress sqp
             JOIN quest_shares qs ON sqp.quest_share_id = qs.id
             WHERE qs.created_by_user_id = ?`,
            [userId]
        )
        const questProgressTaxaCount = (
            questProgressTaxaResult as { count: number }[]
        )[0].count

        return {
            totalQuestsParticipated: ownedQuestsCount + sharedQuestsCount,
            activeQuests: activeQuestsCount,
            taxaFound: collectionsTaxaCount + questProgressTaxaCount,
        }
    }

    return {
        ...base,
        create,
        findUserForDisplay,
        findUsersForAdmin,
        searchUsersByUsername,
        getUserStats,
    }
}
