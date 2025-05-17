import {z} from 'zod'
import { collectionSchema } from '../server/_schemas/collection.schema.js'
import { collectionToTaxaSchema } from '../server/_schemas/collection_to_taxa.schema.js'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
} from '../shared/schemas/Auth.js'
import {UserSchema} from '../shared/schemas/UserSchema.js'

export type UserData = z.infer<typeof UserSchema>

export type Collection = z.infer<typeof collectionSchema>
export type CollectionToTaxaSchema = z.infer<typeof collectionToTaxaSchema>

export type LoginRequestBody = z.infer<typeof LoginRequestSchema>
export type RegisterRequestBody = z.infer<typeof RegisterRequestSchema>
