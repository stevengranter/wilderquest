import { z } from 'zod'

export const CollectionToTaxaSchema = z.object({
    id: z.number(),
    collection_id: z.number(),
    taxon_id: z.number(),
})

export const CollectionSchema = z.object({
    id: z.number(),
    user_id: z.number(),
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
