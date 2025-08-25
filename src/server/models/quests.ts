import { z } from 'zod'

export const QuestSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    created_at: z.date(),
    updated_at: z.date(),
    starts_at: z.date().nullable(),   // Date | null
    ends_at: z.date().nullable(),
    description: z.string().optional(),
    is_private: z.boolean(),
    user_id: z.number().int(),
    username: z.string(),
    status: z.enum(["pending", "active", "paused", "ended"]),
    location_name: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export interface Quest extends z.infer<typeof QuestSchema> {}
