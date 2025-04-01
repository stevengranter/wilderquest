// schemas/user.schema.ts

import { z } from "zod"

export const userSchema = z.object({
    username: z.string().min(2).max(30),
    password: z.string().min(8),
})

export const userRegistrationSchema = userSchema
    .merge(z.object({
        email: z.string().email()})
    )
