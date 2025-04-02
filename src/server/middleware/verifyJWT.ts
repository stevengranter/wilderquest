import "dotenv/config"
import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"]
    if (!authHeader) {
        res.sendStatus(401)
        console.log("No auth header")
        return
    }


    const token = authHeader && authHeader.split(" ")[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
        (err: any, decoded: any) => {
            if (err) {
                res.status(403).json({ message: "Invalid token / Token Expired" })
                console.log(err)
                return
            }
            console.log(decoded)
            req.body.user_cuid = decoded.user_cuid
            req.body.user_id = decoded.user_id
            next()
        }
    )
}

export default verifyJWT
