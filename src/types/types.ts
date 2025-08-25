import { z } from 'zod'
import { LoginRequestSchema, RegisterRequestSchema } from '../shared/schemas/Auth.js'
import { UserSchema } from '../shared/schemas/UserSchema.js'
import { Quest, QuestWithTaxa } from '../server/repositories/QuestRepository.js'
import { CollectionSchema } from '@server/models/collections.js'
import { CollectionToTaxaSchema } from '@server/models/collections_to_taxa.js'

export type UserData = z.infer<typeof UserSchema>

export type Collection = z.infer<typeof CollectionSchema>
export type CollectionToTaxaSchema = z.infer<typeof CollectionToTaxaSchema>

export type LoginRequestBody = z.infer<typeof LoginRequestSchema>
export type RegisterRequestBody = z.infer<typeof RegisterRequestSchema>

export type { Quest, QuestWithTaxa }
