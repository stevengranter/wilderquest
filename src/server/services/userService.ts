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

    return { getUserProfileById, getUserProfileByUsername, getUserStats }
}
