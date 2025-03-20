import { db } from "../services/db.js";

import bcrypt from "bcrypt";

const saltRounds = 10;

type userData = {
  email: string;
  password: string;
};

export async function findUser(
  email: string,
): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  try {
    const result = await db.querySelect(
      "SELECT email FROM users WHERE email = ?",
      [email.toLowerCase()],
    );
    return { success: true, exists: result.length > 0 };
  } catch (error: unknown) {
    console.error("Error checking email existence:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const registerUser = async (userData: userData) => {
  console.log("registerUser()");
  let response;
  try {
    const emailCheckResult = await findUser(userData.email);

    if (!emailCheckResult.success) {
      return {
        success: false,
        message: "Error checking email existence",
        error: emailCheckResult.error,
      };
    }

    if (emailCheckResult.exists) {
      return { success: false, message: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const result = await db.queryModify(
      "INSERT INTO users(email, password, created, updated) VALUES (?,?,?,?)",
      [userData.email.toLowerCase(), hashedPassword, new Date(), new Date()],
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
  }

  return response;
};
