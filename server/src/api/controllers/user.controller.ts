import { db } from "../services/db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

type userData = {
  email: string;
  password: string;
};

export const registerUser = async (userData: userData) => {
  console.log("registerUser()");
  let response;
  try {
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const result = await db.query(
      `INSERT INTO users(email, password, created, updated) VALUES (?, ?, ?, ?)`,
      [userData.email, hashedPassword, new Date(), new Date()],
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
    // return response; // Make sure to return a value from the function
  }

  return response;
};
