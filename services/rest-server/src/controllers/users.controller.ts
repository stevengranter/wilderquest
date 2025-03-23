// users.controller.ts
import { Request, Response } from "express"
import bcrypt from "bcrypt"
import { db } from "../server.js"
import { userSchema, userRegistrationSchema } from "../schemas/user.schema.js"

const getAllUsers = async (req: Request, res: Response) => {
    const rows = await db.query("SELECT email,username FROM user_data")
    if (!rows || (Array.isArray(rows) && rows.length < 1)) {
        res.status(400).json({ message: "No users found" })
        return
    }

    res.status(200).json(rows)
}

const createNewUser = async (req: Request, res: Response) => {
    const parsedBody = userRegistrationSchema.safeParse(req.body)

    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }

    const { email, password: UNSAFEPassword } = parsedBody.data

    const rows = await db.query("SELECT email FROM user_data WHERE email = ?", [
        email.toLowerCase(),
    ])
    console.log(rows)
    if (rows && rows.length > 0) {
        console.log(rows)
        res.status(400).json({
            message: `Cannot create user, email ${email} already registered`,
        })
        return
    }
    const hashedPassword = await bcrypt.hash(UNSAFEPassword, 10)

    const result = await db.mutate(
        "INSERT INTO user_data(email, password, createdAt, updatedAt) VALUES" +
            " (?,?,?,?)",
        [email.toLowerCase(), hashedPassword, new Date(), new Date()]
    )

    console.log(result)

    if (result.affectedRows > 0) {
        res.status(200).json({ message: "User created successfully" })
    } else {
        res.status(500).json({ message: "Failed to create user" })
    }
}

const updateUser = async (req: Request, res: Response) => {
    const parsedBody = userSchema.safeParse(req.body)

    if (parsedBody.error) {
        res.status(400).send(parsedBody.error.message)
        return
    }

    const { email, password: UNSAFEPassword, username } = parsedBody.data
    const rows = await db.query("SELECT email FROM user_data WHERE email = ?", [
        email.toLowerCase(),
    ])
    if (rows && rows.length > 0) {
        if (username) {
            const result = await db.mutate(
                "UPDATE user_data SET username = ? WHERE email = ?",
                [username, email]
            )
            if (result.affectedRows > 0) {
                res.status(200).json({ message: "Username updated" })
            } else {
                res.status(500).json({ message: "Failed to update username" })
            }
        }

        if (UNSAFEPassword) {
            const password = await bcrypt.hash(UNSAFEPassword, 10)
            const result = await db.mutate(
                "UPDATE user_data SET password = ? WHERE email = ?",
                [password, email]
            )
            if (result.affectedRows > 0) {
                res.status(200).json({ message: "Password updated" })
            } else {
                res.status(500).json({ message: "Failed to update password" })
            }
        }
    } else {
        res.status(400).json({ message: "User not found" })
    }
}

const deleteUser = async (req: Request, res: Response) => {
    res.status(500).json({ message: "Not implemented" })
}

const usersController = { getAllUsers, createNewUser, updateUser, deleteUser }

export default usersController
