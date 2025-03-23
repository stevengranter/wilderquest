import "dotenv/config"
import jwt from "jsonwebtoken"
import { db } from "../server.js"
import { Request, Response } from "express"

const handleRefreshToken = async (req: Request, res: Response) => {
    const cookies = req.cookies
    if (!cookies?.jwt) {
        res.status(401)
        return
    }

    const refreshToken = cookies.jwt

    // Check if user exists
    const [foundUser] = await db.query(
        "SELECT email,refresh_token FROM user_data WHERE refresh_token = ?",
        [refreshToken]
    )
    console.log(foundUser)
    if (!foundUser || foundUser.length < 1) {
        res.status(403)
        return
    }

    //evaluate JWT
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
        (err: any, decoded: any) => {
            if (err || foundUser.email !== decoded.email) {
                res.status(403)
                return
            }
            const accessToken = jwt.sign(
                { email: decoded.email },
                process.env.ACCESS_TOKEN_SECRET!,
                { expiresIn: "30s" }
            )

            res.json({ accessToken })
        }
    )
}

const refreshTokenController = { handleRefreshToken }

export default refreshTokenController
