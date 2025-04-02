import 'dotenv/config'
import jwt from 'jsonwebtoken'
// import db from '../db.js'
import { NextFunction, Request, Response } from 'express'

import { z } from 'zod'
import UsersRepository from "../repositories/UsersRepository.js";

const RefreshReqBodySchema = z.object({
    user_cuid: z.string().cuid2(),
    refresh_token: z.string(),
})

const handleRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Check req.body to see if matches schema
    console.log(req.body)
    const parsedBody = RefreshReqBodySchema.safeParse(req.body)

    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }

    const { user_cuid, refresh_token } = parsedBody.data


    const foundUser = await UsersRepository.findOne({user_cuid,refresh_token})

    console.log('foundUser:', foundUser)

    if (!foundUser) {
        res.status(403).send({
            message: 'User not found / Invalid refresh token',
        })
        return
    } else {
        console.log('User found!')
        console.log(refresh_token)
        jwt.verify(
            refresh_token,
            process.env.REFRESH_TOKEN_SECRET!,
            (err: any, decoded: any) => {
                if (err || foundUser.user_cuid !== decoded.user_cuid) {
                    console.log(err)
                    res.status(403).send({
                        success: false,
                        message: 'Refresh token expired, login required',
                    })
                    return
                }
                console.log(decoded)
                const accessToken = jwt.sign(
                    { user_cuid: decoded.user_cuid },
                    process.env.ACCESS_TOKEN_SECRET!,
                    { expiresIn: '30s' }
                )
                console.log('Refresh token valid')
                res.json({ access_token:accessToken })
            }
        )
    }
}

const refreshTokenController = { handleRefreshToken }

export default refreshTokenController
