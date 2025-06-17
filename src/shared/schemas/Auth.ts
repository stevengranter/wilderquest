import {UserSchema} from './UserSchema.js'
import { z } from 'zod'

export const RegisterRequestSchema = UserSchema.pick({
    username: true,
    email: true,
    password: true,
})

export const LoginRequestSchema = UserSchema.pick({
    username: true,
    password: true,
})

export const RefreshReqBodySchema = z.object({
    user_cuid: z.string().cuid2(),
    refresh_token: z.string(),
})
