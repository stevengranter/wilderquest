import express, { Router } from "express";
const router: Router = express.Router();
import { router as authRouter } from "./routes/auth.routes.js";
import { router as gifRouter } from "./api/routes/gifs.route.js";

router.get("/api", async (req, res) => {
  res.send("API server is listening at http://localhost:3000");
});

router.use("/", authRouter);

router.use("/gifs", gifRouter);

export { router };
