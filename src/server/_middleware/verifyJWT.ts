import 'dotenv/config'
import jwt from 'jsonwebtoken'
import {Request, Response, NextFunction} from 'express'

export interface AuthenticatedRequest extends Request {
    headers: {
        authorization?: string
    }
    user?: {
        id: number
        cuid: string
        role_id: number
    }
}

const verifyJWT = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.headers.authorization) {
        console.error('Authorization header is missing')
    }
    const authHeader = req.headers.authorization // Access authorization directly
    // if (!req.body) req.body = {};

    if (!authHeader) {
        res.sendStatus(401)
        console.log('No auth header')
        return
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        (err: any, decoded: any) => {
            if (err) {
                res.status(403).json({
                    message: 'Invalid token / Token Expired',
                })
                console.log(err)
                return
            }
            console.log(decoded)
            req.user = {
                id: decoded.id,
                cuid: decoded.cuid,
                role_id: decoded.role_id,
            }
            next()
        }
    )
}

export default verifyJWT
