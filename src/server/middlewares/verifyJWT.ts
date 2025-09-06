import 'dotenv/config'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { serverDebug } from '../../shared/utils/debug.js'

export interface AuthenticatedRequest extends Request {
    headers: {
        authorization?: string
        Authorization?: string
    }
    user?: TokenUserData
}

type TokenUserData = {
    id: number
    cuid: string
    role_id: number
}

const verifyJWT = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    serverDebug.auth('JWT middleware: req.body=%o', req.body)
    if (!req.headers.authorization) {
        serverDebug.auth('JWT middleware: Authorization header is missing')
    }
    const authHeader = req.headers.authorization

    if (!authHeader) {
        serverDebug.auth('JWT middleware: No auth header')
        res.sendStatus(401)
        return
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET! as string,
        (err, decoded) => {
            if (err) {
                serverDebug.auth(
                    'JWT middleware: Invalid token or token expired: %o',
                    err
                )
                return res.sendStatus(401) // ✅ Fixed: Send 401 instead of calling next()
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
                serverDebug.auth('JWT middleware: Error in decoding token')
                res.sendStatus(401) // ✅ Added: Send 401 for undefined decoded token
            }
        }
    )
}

export const optionalAuthMiddleware = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader) {
        return next()
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET! as string,
        (err, decoded) => {
            if (err) {
                return next()
            }

            if (decoded) {
                const userData = decoded as jwt.JwtPayload & TokenUserData

                req.user = {
                    id: userData.id,
                    cuid: userData.cuid,
                    role_id: userData.role_id,
                }
            }
            next()
        }
    )
}

export default verifyJWT
