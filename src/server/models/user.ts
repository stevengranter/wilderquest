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

export interface SafeUserDTO extends z.infer<typeof SafeUserSchema> {}
