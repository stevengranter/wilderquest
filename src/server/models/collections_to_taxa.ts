import { z } from 'zod'

export const CollectionToTaxaSchema = z.object({
    id: z.number(),
    collection_id: z.number(),
    taxon_id: z.number(),
})

export type CollectionsToTaxa = z.infer<typeof CollectionToTaxaSchema>;
