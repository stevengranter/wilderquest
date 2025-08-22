import { z } from 'zod'

export const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    locationName: z.string().min(2, {
        message: 'Location name must be at least 2 characters.',
    }),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    isPrivate: z.boolean(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
})