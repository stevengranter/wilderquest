import { z } from 'zod'

export const QuestShareSchema = z.object({
    id: z.number().int(),
    token: z.string(),
    quest_id: z.number().int(),
    created_by_user_id: z.number().int(),
    guest_name: z.string().nullable().optional(), // string | null | undefined
    expires_at: z.date().nullable().optional(),   // Date | null | undefined
    created_at: z.date(),
    updated_at: z.date(),
});

export interface QuestShare extends z.infer<typeof QuestShareSchema> {}
