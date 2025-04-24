import {z} from 'zod'

export const collectionToTaxaSchema = z.object({
    id: z.number().min(1),
    collection_id: z.number().min(1),
    taxon_id: z.number().min(1),
})
