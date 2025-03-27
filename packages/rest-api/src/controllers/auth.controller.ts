import 'dotenv/config'
import { compareSync } from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import { userSchema } from '../schemas/user.schema.js'
import { db } from '../server.js'
import { Request, Response } from 'express'

const handleLogin = async (req: Request, res: Response) => {
    // Check req.body to see if matches schema
    const parsedBody = userSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }
    const { email, password } = parsedBody.data

    // Check if user exists
    const [foundUser] = await db.query(
        'SELECT email,password FROM user_data WHERE' + ' email = ?',
        [email.toLowerCase()]
    )
    if (!foundUser || foundUser.length < 1) {
        res.sendStatus(401)
        return
    }

    // Check if password matches
    const match = compareSync(password, foundUser.password)
    console.log('foundUser.email', foundUser.email)
    if (match) {
        const accessToken = jwt.sign(
            { user: foundUser.email },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '30s' }
        )
        const refreshToken = jwt.sign(
            { user: foundUser.email },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '1h' }
        )
        const result = await db
            .mutate('UPDATE user_data SET refresh_token = ? WHERE email = ?', [
                refreshToken,
                foundUser.email,
            ])
            .then(() => console.log('Refresh token saved to database'))

        // res.cookie("jwt", refreshToken, {
        //   httpOnly: true,
        //   maxAge: 24 * 60 * 60 * 1000,
        // });
        res.status(200).json({
            user: foundUser.email,
            accessToken,
            refreshToken,
            // message: "Successfully logged in",
        })
    } else {
        res.sendStatus(401)
    }

    // console.log(foundUser)
}

const authController = { handleLogin }

export default authController
