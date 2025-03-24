import "dotenv/config"
import { db } from "../server.js"
import { Request, Response } from "express"

const handleLogout = async (req: Request, res: Response) => {
    // On react-client, also delete access token
    const cookies = req.cookies
    if (!cookies?.jwt) {
        res.sendStatus(204)
        return
    }

    const refreshToken = cookies.jwt

    // Is refreshToken in db?
    const [foundUser] = await db.query(
        "SELECT email,refresh_token FROM user_data WHERE refresh_token = ?",
        [refreshToken]
    )
    if (!foundUser || foundUser.length < 1) {
        res.clearCookie("jwt", { httpOnly: true })
        res.sendStatus(204)
        return
    }

    // Delete refresh token in db
    await db.query(
        "UPDATE user_data SET refresh_token = NULL WHERE refresh_token = ?",
        [refreshToken]
    )

    res.clearCookie("jwt", { httpOnly: true })
    res.status(200).json({ message: "Logout successful" })
    return
}

const logoutController = { handleLogout }

export default logoutController
