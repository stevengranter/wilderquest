import { z } from 'zod'

export const CollectionToTaxaSchema = z.object({
    id: z.number(),
    collection_id: z.number(),
    taxon_id: z.number(),
})

export interface CollectionsToTaxa extends z.infer<typeof CollectionToTaxaSchema> {}
