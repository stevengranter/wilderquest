import { type SafeUserDTO } from '../models/_index.js'
import { type UserRepository } from '../repositories/UserRepository.js'

export type UserService = ReturnType<typeof createUserService>

export function createUserService(userRepository: UserRepository) {
    async function getUserProfileById(
        id: number
    ): Promise<Partial<SafeUserDTO> | null> {
        return userRepository.findUserForDisplay({ id })
    }
    async function getUserProfileByUsername(
        username: string
    ): Promise<Partial<SafeUserDTO> | null> {
        return userRepository.findUserForDisplay({ username })
    }

    async function searchUsers(
        query: string,
        options: {
            limit?: number
            offset?: number
            excludeUserId?: number
        } = {}
    ): Promise<{ users: SafeUserDTO[]; total: number } | null> {
        // Validate query
        if (!query || query.trim().length < 2) {
            return null
        }

        const trimmedQuery = query.trim()

        // Validate limit
        const { limit = 20, offset = 0, excludeUserId } = options
        const validLimit = Math.min(Math.max(limit, 1), 50) // 1-50
        const validOffset = Math.max(offset, 0)

        return userRepository.searchUsersByUsername(trimmedQuery, {
            limit: validLimit,
            offset: validOffset,
            excludeUserId,
        })
    }

    async function getUserStats(username: string): Promise<{
        totalQuestsParticipated: number
        activeQuests: number
        taxaFound: number
    } | null> {
        // First get the user to get their ID
        const user = await userRepository.findUserForDisplay({ username })
        if (!user || !user.id) {
            return null
        }

        return userRepository.getUserStats(user.id)
    }

    return {
        getUserProfileById,
        getUserProfileByUsername,
        searchUsers,
        getUserStats,
    }
}
