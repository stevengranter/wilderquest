import { z } from 'zod'
import { UserSchema } from '../schemas/user.schemas.js'

export type User = z.infer<typeof UserSchema>;
