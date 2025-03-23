// schemas/user.schema.ts

import { z } from "zod"

export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3).max(20).optional(),
})

export const userRegistrationSchema = userSchema
    .merge(z.object({ confirmPassword: z.string().min(8) }))
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "password and confirmPassword do not match",
    })
