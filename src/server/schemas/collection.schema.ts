import {z} from "zod";

export const collectionSchema = z.object({
    id: z.number().min(1).optional(),
    name: z.string().min(1),
    description: z.string().min(10).max(128).optional(),
    emoji: z.string().emoji().optional(),
    taxon_ids: z.number().array().optional()
})


