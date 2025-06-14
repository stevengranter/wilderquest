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
        async handleRefreshToken(req: Request, res: Response) {
            const parsedBody = RefreshReqBodySchema.safeParse(req.body)

            if (!parsedBody.success) {
                res.status(400).send(parsedBody.error.message)
                return
            }

            const { user_cuid, refresh_token } = parsedBody.data

            const foundUser = await userRepository.findOne({ user_cuid, refresh_token })

            if (!foundUser) {
                res.status(403).send({ message: 'Invalid refresh token or user not found' })
                return
            }

            jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN_SECRET!,
                (err, decoded) => {
                    if (
                        err ||
                        typeof decoded !== 'object' ||
                        decoded === null ||
                        'cuid' ! in decoded ||
                        foundUser.user_cuid !== (decoded as JwtPayload).cuid
                    ) {
                        res.status(403).send({ message: 'Refresh token expired or invalid' })
                        return
                    }

                    const payload = decoded as JwtPayload

                    const access_token = jwt.sign(
                        { cuid: payload.cuid, role_id: payload.role_id },
                        process.env.ACCESS_TOKEN_SECRET!,
                        { expiresIn: '30s' },
                    )

                    res.json({ access_token })
                },
            )
        },
    }
}
