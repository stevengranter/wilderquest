import z from 'zod'

const UserProfileWithTokenSchema = z.object({
    userId: z.string(),
    accessToken: z.string(),
    refreshToken: z.string(),
})

export type UserProfileWithToken = z.infer<typeof UserProfileWithTokenSchema>
