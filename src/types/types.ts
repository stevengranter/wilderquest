import { z } from 'zod'
import {
    LoginRequestSchema,
    RegisterRequestSchema,
} from '../shared/schemas/Auth.js'
import { UserSchema } from '../shared/schemas/UserSchema.js'
import { QuestWithTaxa } from '../shared/types/questTypes.js'

export interface UserData extends z.infer<typeof UserSchema> {}

export interface LoginRequestBody extends z.infer<typeof LoginRequestSchema> {}
export interface RegisterRequestBody
    extends z.infer<typeof RegisterRequestSchema> {}

export type { QuestWithTaxa }
