// _schemas/userSchema.ts

import { z } from 'zod'

export const UserSchema = z.object({
    id: z.number().int().min(1).optional(),
    username: z.string().min(2).max(30),
    email: z.string().email().optional(),
    password: z.string().min(8),
    user_cuid: z.string().cuid2(),
    created_at: z.instanceof(Date).optional(),
    updated_at: z.instanceof(Date).optional(),
    role_id: z.number().int().min(1),
    refresh_token: z.string().jwt().nullish(),
})
