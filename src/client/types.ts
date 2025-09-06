import { z } from 'zod'
import { LoginRequestSchema, RegisterRequestSchema } from '@shared/schemas/Auth'
import { UserSchema } from '@shared/schemas/UserSchema'
import { Quest, QuestWithTaxa } from '@shared/types/questTypes'

export interface UserData extends z.infer<typeof UserSchema> {}

export interface LoginRequestBody extends z.infer<typeof LoginRequestSchema> {}
export interface RegisterRequestBody
    extends z.infer<typeof RegisterRequestSchema> {}

export type { Quest, QuestWithTaxa }
