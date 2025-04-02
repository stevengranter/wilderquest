import {z} from "zod";
import {collectionSchema} from "./server/schemas/collection.schema.js";

export type Collection = z.infer<typeof collectionSchema>
