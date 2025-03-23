import { Router } from "express"
import refreshTokenController from "../controllers/refreshToken.controller.js"

const router = Router()

router.get("/", refreshTokenController.handleRefreshToken)

export { router as refreshTokenRouter }
