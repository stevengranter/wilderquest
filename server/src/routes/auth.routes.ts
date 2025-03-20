import express, { Router } from "express";
const router: Router = express.Router();

import { userRegistrationSchema } from "../schemas/user.schemas.js";
import { StatusCodes } from "http-status-codes";
import { registerUser } from "../controllers/auth.controller.js";
import { findUser } from "../controllers/auth.controller.js";
import { db } from "../services/db.js";
import bcrypt from "bcrypt";

router.post("/login", async (req, res) => {
  const result = userRegistrationSchema.safeParse(req.body);
  if (!result.success) {
    console.log(result.error);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ success: false, message: result.error });
  }

  const { email, password } = result.data;
  // Find the user by email
  const query = "SELECT * FROM users WHERE email = ?";

  try {
    const rows = await db.querySelect(query, [email]);
    if (rows.length === 0) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        req.session.user = { email: user.email };
        res.status(200).send({ success: true, message: "Login successful" });
      } else {
        res
          .status(401)
          .send({ success: false, message: "Invalid credentials" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res, next) => {
  req.session.user = null;
  req.session.save(function (err) {
    if (err) next(err);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err);
      console.log("User has been logged out");
      res.redirect("/");
    });
  });
});

router.post("/register", async (req, res) => {
  const result = userRegistrationSchema.safeParse(req.body);

  if (!result.success) {
    console.log(result.error);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ success: false, message: result.error });
  }

  const { email } = result.data;
  const emailCheckResult = await findUser(email);

  if (!emailCheckResult.success) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, message: emailCheckResult.error });
  }

  if (emailCheckResult.exists) {
    return res
      .status(StatusCodes.CONFLICT)
      .send({ success: false, message: "Email already registered" });
  }

  const registrationResponse = await registerUser(result.data);

  if (!registrationResponse.success) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ success: false, message: registrationResponse.message });
  }

  return res
    .status(StatusCodes.CREATED)
    .send({ success: true, message: registrationResponse.message });
});

export { router };
