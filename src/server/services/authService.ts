// Define custom error classes for better error handling
import { UserRepositoryInstance } from '../repositories/UserRepository.js'
import { genSaltSync, hashSync } from 'bcrypt-ts'
import { createId } from '@paralleldrive/cuid2'

export class UserExistsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserExistsError'
    }
}

export class UserCreationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserCreationError'
    }
}

export class UserRetrievalError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UserRetrievalError'
    }
}

type ParsedUserData = {
    username: string
    email: string
    password: string
}

// Instantiate a InstanceType for TypeScript completions
type AuthServiceConstructor = typeof AuthService;
export type AuthServiceInstance = InstanceType<AuthServiceConstructor>;


export default class AuthService {
    constructor(private userRepository: UserRepositoryInstance) {
    }


    registerUser = async (data: ParsedUserData) => {
        const { username, password, email } = data

        const emailExists = (await this.userRepository.findRowByColumnAndValue('email', email)).length > 0
        const usernameExists = (await this.userRepository.findRowByColumnAndValue('username', username)).length > 0

        if (emailExists || usernameExists) {
            // Throw a custom error instead of sending a response
            throw new UserExistsError('Username and/or email already exists')
        }

        const hashedPassword = hashSync(password, genSaltSync(10))
        const userCuid = createId() // Ensure createId() is defined or imported

        const newUser = {
            username,
            email,
            password: hashedPassword,
            user_cuid: userCuid,
            role_id: 1,
        }

        const user_id = await this.userRepository.create(newUser)

        if (!user_id) {
            // Throw an error if user creation fails
            throw new UserCreationError('Failed to create user')
        }

        const createdUser = await this.userRepository.findOne({ id: user_id })

        if (!createdUser) {
            // Throw an error if the user can't be retrieved after creation
            throw new UserRetrievalError('User created but not retrievable')
        }

        // Return the created user object
        return createdUser
    }

    // You might also consider adding a login method here if it's part of auth service
    // login = async (username: string, password: string) => {
    //     // ... login logic, throw errors or return user on success
    // }
}