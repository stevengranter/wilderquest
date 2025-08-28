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
    mode: z.enum(['competitive', 'cooperative']),
    starts_at: z
        .string()
        .refine((val) => val.length === 0 || !isNaN(Date.parse(val)), {
            message: 'Start date must be a valid date and time.',
        }),
    ends_at: z
        .string()
        .refine((val) => val.length === 0 || !isNaN(Date.parse(val)), {
            message: 'End date must be a valid date and time.',
        }),
})
