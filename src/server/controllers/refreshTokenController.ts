import 'dotenv/config'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Request, Response } from 'express'

import { z } from 'zod'
import UserRepository from '../repositories/UserRepository.js'

const RefreshReqBodySchema = z.object({
    user_cuid: z.string().cuid2(),
    refresh_token: z.string(),
})

export function createRefreshTokenController(userRepository: UserRepository) {
    return {

    }
}
