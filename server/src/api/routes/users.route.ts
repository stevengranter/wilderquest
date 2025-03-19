import express, { Router } from "express";
const router: Router = express.Router();
import { errorHandler } from "../utils.js";
import { userRegistrationSchema } from "../schemas/user.schemas.js";
import { StatusCodes } from "http-status-codes";
import { registerUser } from "../controllers/user.controller.js";
import { findUser } from "../controllers/user.controller.js";

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

router.get("/", async (req, res) => {
  const userId = req.query.id;
  if (!userId) {
    return errorHandler(
      new Error("Please provide a valid query string with 'id' parameter"),
      req,
      res,
      () => {},
    );
  }
  res.send(`User ID: ${userId}`);
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  console.log(req.params);
  res.send(`User ID: ${userId}`);
});

export { router };
