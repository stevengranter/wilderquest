import { z } from 'zod'

export type Collection = z.infer<typeof CollectionSchema>;

export const CollectionSchema = z.object({
    id: z.number(),
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


