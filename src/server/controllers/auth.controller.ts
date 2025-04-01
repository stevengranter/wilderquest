import 'dotenv/config'
import {compareSync, genSaltSync, hashSync} from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import {userRegistrationSchema, userSchema} from '../schemas/user.schema.js'
import { db } from '../server.js'
import { Request, Response } from 'express'
import {createId} from "@paralleldrive/cuid2";
import {LoginResponse} from "../../shared/types/authTypes.js";


const register = async(req:Request, res:Response) => {
    // Check req.body to see if matches schema
    const parsedBody = userRegistrationSchema.safeParse(req.body)

    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message);
        return;
    }

    const { username, email, password: UNSAFEPassword } = parsedBody.data;

    // Check if email or username already exists in db
    const [emailExists] = await db.query(
        "SELECT email FROM user_data WHERE email = ?",
        [email])

    const [usernameExists] = await db.query(
        "SELECT username FROM user_data WHERE username = ?",
        [username])

    if (emailExists || usernameExists) {
        res.status(409).send({message:"Email or username already exists"});
        return
    }

    const hashedPassword = hashSync(UNSAFEPassword, genSaltSync(10));

    const userId = createId()

    const SQL =
    `INSERT INTO user_data 
    (user_cuid, email, username, password, created_at,updated_at) 
    VALUES (?,?,?,?,?,?)`


    const result = await db.mutate(SQL,
        [userId, email, username, hashedPassword, new Date(), new Date()]
    )

    if (result.affectedRows > 0) {
        res.status(200).json({
            userId,
            message: "User created successfully!"});
    } else {
        res.sendStatus(500).json({ message: "Failed to create user" });
    }

}



const login = async (req: Request, res: Response) => {
    // Check req.body to see if matches schema
    const parsedBody = userSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }
    const { username, password } = parsedBody.data

    const SQL =
        'SELECT username,password,user_cuid FROM user_data WHERE username = ?'

    // Check if user exists
    const [foundUser] = await db.query(SQL, [username])
    if (!foundUser || foundUser.length < 1) {
        res.sendStatus(401)
        return
    }

    // Check if password matches
    const match = compareSync(password, foundUser.password)

    if (match) {
        const accessToken = jwt.sign(
            { user_cuid: foundUser.user_cuid },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '30s' }
        )
        const refreshToken = jwt.sign(
            { user_cuid: foundUser.user_cuid },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '1h' }
        )

        const SQL =
            'UPDATE user_data SET refresh_token = ? WHERE user_cuid = ?'

        const result = await db
            .mutate(SQL, [
                refreshToken,
                foundUser.user_cuid,
            ])
            .then(() => console.log('Refresh token saved to database'))


        res.status(200).json({
            user_cuid: foundUser.user_cuid,
            access_token: accessToken,
            refresh_token: refreshToken,

        })
    } else {
        res.sendStatus(401)
    }

}

const logout = async (req:Request, res: Response) => {
    const {user_cuid} = req.body
    if (!user_cuid) res.sendStatus(400)

    const SQL =
        "UPDATE user_data SET refresh_token = NULL WHERE user_cuid = ?"

    const result = await db.mutate(SQL,[user_cuid])
    if (result.affectedRows > 0) {
        res.sendStatus(204)
    } else {
        res.sendStatus(400)
    }
}

const authController = { register, login, logout }

export default authController
