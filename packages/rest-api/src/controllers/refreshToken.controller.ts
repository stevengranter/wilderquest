import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { db } from '../server.js'
import { NextFunction, Request, Response } from 'express'

import { z } from 'zod'

const RefreshReqBodySchema = z.object({
    user: z.string().email(),
    refreshToken: z.string(),
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

    const { user, refreshToken } = parsedBody.data
    console.log(parsedBody.data)
    // Check if user exists
    const [foundUser] = await db.query(
        'SELECT email,refresh_token FROM user_data WHERE refresh_token = ? AND email = ?',
        [refreshToken, user]
    )
    console.log('foundUser:', foundUser)
    if (!foundUser || foundUser.length < 1) {
        res.status(403).send({
            message: 'User not found / Invalid refresh token',
        })
        return
    } else {
        console.log('User found!')
        console.log(refreshToken)
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!,
            (err: any, decoded: any) => {
                if (err || foundUser.email !== decoded.user) {
                    console.log(err)
                    res.status(403).send({
                        success: false,
                        message: 'Refresh token expired, login required',
                    })
                    return
                }
                console.log(decoded)
                const accessToken = jwt.sign(
                    { user: decoded.user },
                    process.env.ACCESS_TOKEN_SECRET!,
                    { expiresIn: '30s' }
                )
                console.log('Refresh token valid')
                res.json({ accessToken })
            }
        )
    }

    // if (!foundUser || foundUser.length < 1) {
    //     res.status(403).send({
    //         message: 'User not found / Invalid refresh token',
    //     })
    //     return
    // } else {
    //     console.log('User found')
    //     //evaluate JWT
    //     jwt.verify(
    //         refreshToken,
    //         process.env.REFRESH_TOKEN_SECRET!,
    //         (err: any, decoded: any) => {
    //             if (err || foundUser.email !== decoded.email) {
    //                 console.log(err)
    //                 res.status(403).send({
    //                     success: false,
    //                     message: 'Invalid refresh token',
    //                 })
    //                 return
    //             }
    //             console.log(decoded)
    //             const accessToken = jwt.sign(
    //                 { email: decoded.email },
    //                 process.env.ACCESS_TOKEN_SECRET!,
    //                 { expiresIn: '30s' }
    //             )
    //             console.log('Refresh token valid')
    //             res.json({ accessToken })
    //         }
    //     )
    // }
}

const refreshTokenController = { handleRefreshToken }

export default refreshTokenController
