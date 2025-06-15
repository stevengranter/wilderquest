import { UserSchema } from './user.schemas.js'

export const RegisterRequestSchema = UserSchema.pick({
    username: true,
    email: true,
    password: true,
})

export const LoginRequestSchema = UserSchema.pick({
    username: true,
    user_cuid: true,
    refresh_token: true,
})
