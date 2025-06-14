import { z } from 'zod'
import { CollectionSchema } from '../schemas/collection.schemas.js'

export type Collection = z.infer<typeof CollectionSchema>;
