import express, { Router } from "express";
const router: Router = express.Router();
import { router as userRouter } from "./routes/users.js";
import { router as gifRouter } from "./routes/gifs.js";

router.get("/", async (req, res) => {
  res.send("API server is listening at http://localhost:3000");
});

router.use("/users", userRouter);

router.use("/gifs", gifRouter);

export { router };
