import { Router } from "express"
import logoutController from "../controllers/logout.controller.js"

const router = Router()

router.get("/", logoutController.handleLogout)

export { router as logoutRouter }
