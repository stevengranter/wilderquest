import express, { Router } from "express";
const router: Router = express.Router();
import { errorHandler } from "../utils.js";
import { userRegistrationSchema } from "../schemas/user.schemas.js";

router.post("/register", async (req, res) => {
  console.log(req.body);
  userRegistrationSchema.safeParse(req.body);
  res.send(req.body);
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
