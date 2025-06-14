import { z } from 'zod'
import { CollectionToTaxaSchema } from '../schemas/collection.schemas.js'

export type CollectionToTaxa = z.infer<typeof CollectionToTaxaSchema>;
