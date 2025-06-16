import {z} from 'zod'

export const CollectionSchema = z.object({
    id: z.number().min(1).optional(),
    user_id: z.number().min(1).optional(),
    name: z.string().min(1),
    description: z.string().min(10).max(128).optional(),
    emoji: z.string().emoji().optional(),
    taxon_ids: z.number().array().optional(),
    is_private: z.boolean().optional(),
})

export const CollectionToTaxaSchema = z.object({
    id: z.number().min(1),
    collection_id: z.number().min(1),
    taxon_id: z.number().min(1),
})
