import express, { Router } from "express";
const router: Router = express.Router();
import { errorHandler } from "../utils.js";
import { userRegistrationSchema } from "../schemas/user.schemas.js";
import { registerUser } from "../controllers/user.controller.js";

router.post("/register", async (req, res) => {
  const result = userRegistrationSchema.safeParse(req.body);
  if (!result.success) {
    console.log(result.error);
    res.status(400).send({ message: result.error });
  } else {
    const response = await registerUser(result.data);
    console.log(response);
    res.status(200).send(response);
  }
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
