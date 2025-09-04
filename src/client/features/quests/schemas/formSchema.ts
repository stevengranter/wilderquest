import { z } from 'zod'

export const formSchema = z
    .object({
        questName: z.string().min(2, {
            message: 'Quest name must be at least 2 characters.',
        }),
        locationName: z.string().min(2, {
            message: 'Location name must be at least 2 characters.',
        }),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
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
    .refine(
        (data) => {
            // If location name is provided, coordinates should also be provided
            if (data.locationName && data.locationName.trim().length > 0) {
                return data.latitude !== null && data.longitude !== null
            }
            return true
        },
        {
            message:
                'Location coordinates are required when a location name is provided.',
            path: ['locationName'],
        }
    )
