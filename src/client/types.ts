import { z } from 'zod'
import { UserSchema } from '@shared/schemas/UserSchema'
import { Quest, QuestWithTaxa } from '@shared/types/questTypes'
import { LoginRequestSchema, RegisterRequestSchema } from '../server/controllers'

export interface UserData extends z.infer<typeof UserSchema> {}

export interface LoginRequestBody extends z.infer<typeof LoginRequestSchema> {}
export interface RegisterRequestBody
    extends z.infer<typeof RegisterRequestSchema> {}

export type { Quest, QuestWithTaxa }
