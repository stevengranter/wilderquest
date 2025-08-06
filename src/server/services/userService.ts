import { SafeUserDTO, UserRepository } from '../repositories/UserRepository.js'

export type UserService = ReturnType<typeof createUserService>

export function createUserService(userRepository: UserRepository) {
    async function getUserProfileById(
        id: number
    ): Promise<Partial<SafeUserDTO> | null> {
        return userRepository.findUser({ id })
    }
    async function getUserProfileByUsername(
        username: string
    ): Promise<Partial<SafeUserDTO> | null> {
        return userRepository.findUser({ username })
    }

    return { getUserProfileById, getUserProfileByUsername }
}
