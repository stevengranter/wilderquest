import 'dotenv/config'
import {compareSync, genSaltSync, hashSync} from 'bcrypt-ts'
import jwt from 'jsonwebtoken'
import {Request, Response} from 'express'
import {createId} from "@paralleldrive/cuid2";
import UsersRepository from "../repositories/UsersRepository.js";
import {LoginRequestSchema, RegisterRequestSchema} from "../../shared/schemas/Auth.js"
import {LoginRequestBody, RegisterRequestBody} from "../../types/types.js";
import {AuthenticatedRequest} from "../middleware/verifyJWT.js";

interface LoginRequest extends Request {
    body: LoginRequestBody;
}

interface RegisterRequest extends Request {
    body: RegisterRequestBody;
}

const register = async (req: LoginRequest, res: Response) => {

     // Check req.body to see if matches schema
    const parsedBody = RegisterRequestSchema.safeParse(req.body)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message);
        return;
    }

    const {username, email, password: UNSAFEPassword} = parsedBody.data;

    // Check if email or username already exists in db
    const emailRows  = await UsersRepository.getUsersByEmail(email)
    const usernameRows = await UsersRepository.getUsersByUsername(username)
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

    // Save user to db
    const user_id = await UsersRepository.create(user)

    if (user_id) {
        // Verify user is in db
        const createdUser = await UsersRepository.findOne({id: user_id});

        // If found, login user
        if (createdUser) {
            req.body  = { username: createdUser.username, password: UNSAFEPassword } as LoginRequestBody; //create login request body
            await login(req, res);

        } else {
            res.status(500).json({ message: "Failed to retrieve created user." });
            return;
        }

    } else {
        res.status(500).json({message: "Failed to create user"})
        return
    }
}

const login = async (req: LoginRequest, res: Response) => {

    // Check req.body to see if matches schema
    const parsedBody = LoginRequestSchema.safeParse(req.body as LoginRequestBody)
    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }

    // Deconstruct username and password from parsedBody
    const {username, password} = parsedBody.data


    const user = await UsersRepository.findOne({username: username})

    if (!user) {
        res.status(401).json({message: "User not found"})
        return
    }

    // Check if password matches
    const match = compareSync(password, user.password)

    if (match) {
        // Generate access and refresh tokens
        const accessToken = jwt.sign(
            {user_cuid: user.user_cuid, user_id: user.id},
            process.env.ACCESS_TOKEN_SECRET!,
            {expiresIn: '300s'}
        )
        const refreshToken = jwt.sign(
            {user_cuid: user.user_cuid, user_id: user.id},
            process.env.REFRESH_TOKEN_SECRET!,
            {expiresIn: '1h'}
        )

        // Save refresh token to db
        const result = UsersRepository.update(user.id,{refresh_token: refreshToken})

        // return user profile to client
        res.status(200).json({
            user: {
                id: user.id,
                cuid: user.user_cuid,
                username: user.username,
                email: user.email,
                role_id: user.role_id,
            },
            user_cuid: user.user_cuid,
            access_token: accessToken,
            refresh_token: refreshToken,

        })
        return
    } else {
        res.status(401).json({message: "User not found"})
        return
    }

}

const logout = async (req: AuthenticatedRequest, res: Response) => {
    if (req.user && req.user.id) {
        const result = UsersRepository.update(req.user.id,{refresh_token: null})
    }
}

const authController = {register, login, logout}

export default authController
