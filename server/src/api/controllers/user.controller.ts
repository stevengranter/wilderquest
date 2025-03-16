import { Request, Response } from "express";
import { db } from "../services/db.js";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";

const saltRounds = 10;

export const registerUser = async (req: Request, res: Response) => {
  let response;
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const result = await db.query(
      `INSERT INTO users(username, password, created, updated) VALUES (?, ?, ?, ?)`,
      [req.body.username, hashedPassword, new Date(), new Date()],
    );

    if (result.affectedRows > 0) {
      response = { success: true, message: "User created successfully" };
    } else {
      response = { success: false, message: "Failed to create user" };
    }
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    response = {
      success: false,
      message: "Error creating user",
      error: error instanceof Error ? error.message : String(error),
    };
    return response; // Make sure to return a value from the function
  }

  res.json(response);
};
