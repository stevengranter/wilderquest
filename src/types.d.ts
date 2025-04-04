import {z} from "zod";
import {collectionSchema} from "./server/schemas/collection.schema.js";
import {collectionToTaxaSchema} from "./server/schemas/collection_to_taxa.schema.js";

export type Collection = z.infer<typeof collectionSchema>
export type CollectionToTaxaSchema = z.infer<typeof collectionToTaxaSchema>
