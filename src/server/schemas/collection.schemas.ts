import { z } from 'zod'

export const CollectionSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    is_private: z.boolean().default(false),
    taxon_ids: z.array(z.number()).optional(),
    emoji: z.string().optional(),
})

export type Collection = z.infer<typeof CollectionSchema> & {
    id: number
    user_id: number
}
