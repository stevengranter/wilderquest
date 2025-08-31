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

    return { getUserProfileById, getUserProfileByUsername }
}
