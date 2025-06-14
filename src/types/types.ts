import {z} from 'zod'
import { CollectionSchema, CollectionToTaxaSchema } from '../server/schemas/collection.schemas.js'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
} from '../shared/schemas/Auth.js'
import {UserSchema} from '../shared/schemas/UserSchema.js'

export type UserData = z.infer<typeof UserSchema>

export type Collection = z.infer<typeof CollectionSchema>
export type CollectionToTaxaSchema = z.infer<typeof CollectionToTaxaSchema>

export type LoginRequestBody = z.infer<typeof LoginRequestSchema>
export type RegisterRequestBody = z.infer<typeof RegisterRequestSchema>
