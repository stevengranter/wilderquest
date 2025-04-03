import 'dotenv/config'
import {compareSync, genSaltSync, hashSync} from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import {userRegistrationSchema, userSchema} from '../schemas/user.schema.js'
import {Request, Response} from 'express'
import {createId} from "@paralleldrive/cuid2";
import UsersRepository from "../repositories/UsersRepository.js";


const register = async (req: Request, res: Response) => {


     // Check req.body to see if matches schema
    const parsedBody = userRegistrationSchema.safeParse(req.body)

    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message);
        return;
    }

    const {username, email, password: UNSAFEPassword} = parsedBody.data;

    // Check if email or username already exists in db
    const emailRows  = await UsersRepository.getUsersByEmail(email)
    const usernameRows = await UsersRepository.getUsersByUsername(username)
    // res.send({emailRows,usernameRows})
    if (emailRows.length > 0 || usernameRows.length > 0) {
        res.status(409).send({message: "Username and/or email already exists"})
        return
    }


    //  If neither username and email are in the db, create user
    const hashedPassword = hashSync(UNSAFEPassword, genSaltSync(10));
    const userCuid = createId()

    const user = {
        role_id: 1,
        user_cuid: userCuid,
        email: email,
        username: username,
        password: hashedPassword,
    }

    const result = await UsersRepository.create(user)

    if (result) {
        res.status(200).json({
            user_id: result,
            user_cuid: userCuid,
            message: "User created successfully!"
    })}

    else {
        res.sendStatus(500).json({message: "Failed to create user"})
        return
    }

}


const login = async (req: Request, res: Response) => {

    // Check req.body to see if matches schema
    const parsedBody = userSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }
    const {username, password} = parsedBody.data


    const userRows = await UsersRepository.getUsersByUsername(username)
    const foundUser = userRows[0]

    if (userRows.length < 1 || !userRows) {
        res.sendStatus(401)
        return
    }

    // Check if password matches
    const match = compareSync(password, foundUser.password)

    if (match) {
        const accessToken = jwt.sign(
            {user_cuid: foundUser.user_cuid, user_id: foundUser.id},
            process.env.ACCESS_TOKEN_SECRET!,
            {expiresIn: '300s'}
        )
        const refreshToken = jwt.sign(
            {user_cuid: foundUser.user_cuid, user_id: foundUser.id},
            process.env.REFRESH_TOKEN_SECRET!,
            {expiresIn: '1h'}
        )

        const result = UsersRepository.update(foundUser.id,{refresh_token: refreshToken})

        res.status(200).json({
            user: {
                id: foundUser.id,
                cuid: foundUser.user_cuid,
                username: foundUser.username,
                email: foundUser.email
            },
            user_cuid: foundUser.user_cuid,
            access_token: accessToken,
            refresh_token: refreshToken,

        })
        return
    } else {
        res.sendStatus(401)
    }

}

const logout = async (req: Request, res: Response) => {
    const {user_id} = req.body
    if (!user_id) res.sendStatus(400)

    const result = UsersRepository.update(user_id,{refresh_token: null})

}

const authController = {register, login, logout}

export default authController
