import {z} from 'zod'

export const CollectionSchema = z.object({
    id: z.number().min(1),
    user_id: z.number().min(1),
    name: z.string().min(1),
    description: z.string().min(10).max(128).optional(),
    emoji: z.string().emoji().optional(),
    taxon_ids: z.number().array().optional(),
    is_private: z.boolean(),
})

export const CollectionToTaxaSchema = z.object({
    id: z.number().min(1),
    collection_id: z.number().min(1),
    taxon_id: z.number().min(1),
})
