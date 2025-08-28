import { z } from 'zod'
import { LoginRequestSchema, RegisterRequestSchema } from '../shared/schemas/Auth.js'
import { UserSchema } from '../shared/schemas/UserSchema.js'
import { CollectionSchema, CollectionToTaxaSchema } from '@server/models/_index.js'
import { QuestSchema } from '../server/models/quests.js'

export interface UserData extends z.infer<typeof UserSchema> {}

export interface Collection extends z.infer<typeof CollectionSchema> {}
export interface CollectionToTaxaSchema
    extends z.infer<typeof CollectionToTaxaSchema> {}

export interface LoginRequestBody extends z.infer<typeof LoginRequestSchema> {}
export interface RegisterRequestBody
    extends z.infer<typeof RegisterRequestSchema> {}

export interface Quest extends z.infer<typeof QuestSchema> {}
export interface QuestWithTaxa extends Quest {
    taxon_ids: number[]
    photoUrl?: string | null
    username?: string
}
