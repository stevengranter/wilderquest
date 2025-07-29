import { z } from 'zod'

export const CollectionToTaxaSchema = z.object({
    id: z.number(),
    collection_id: z.number(),
    taxon_id: z.number(),
})

export const CollectionSchema = z.object({
    id: z.number().optional(),
    user_id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    is_private: z.boolean().default(false),
    emoji: z.string().optional(),
    location_name: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    created_at: z.instanceof(Date).optional(),
    updated_at: z.instanceof(Date).optional(),
})

export const CreateCollectionSchema = CollectionSchema.extend({
    taxon_ids: z.array(z.number()).optional(),
}).omit({ id: true })

export type Collection = z.infer<typeof CollectionSchema> & {
    id: number
    user_id: number
}
