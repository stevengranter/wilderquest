import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
    headers: {
        authorization?: string
    }
    user?: TokenUserData
}

type TokenUserData = {
    id: number
    cuid: string,
    role_id: number,
}

const verifyJWT = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.headers.authorization) {
        console.error('Authorization header is missing')
    }
    const authHeader = req.headers.authorization

    if (!authHeader) {
        res.sendStatus(401)
        console.log('No auth header')
        return
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET! as string,
        (err, decoded) => {
            if (err) {
                console.log('Invalid token or token expired:', err)
                return next()
            }

            if (decoded) {
                const userData = decoded as jwt.JwtPayload & TokenUserData

                req.user = {
                    id: userData.id,
                    cuid: userData.cuid,
                    role_id: userData.role_id,
                }
                next()
            } else {
                console.error(
                    'Error in decoding token in verifyJWT middleware.',
                )
            }
        }
    )
}

export const optionalAuthMiddleware = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        console.log('Authorization header is missing — proceeding as unauthenticated')
        return next()
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET! as string,
        (err, decoded) => {
            if (err) {
                console.log('Invalid token or token expired:', err)
                return next()
            }

            if (decoded) {
                const userData = decoded as jwt.JwtPayload & TokenUserData

                req.user = {
                    id: userData.id,
                    cuid: userData.cuid,
                    role_id: userData.role_id,
                }
            } else {
                console.error(
                    'Decoded token is undefined in optionalAuthMiddleware after successful verification.',
                )
            }
            next()
        }
    )
}

export default verifyJWT