import { Router } from 'express'
import refreshTokenController from '../../2_controllers/refreshToken.controller.js'

const router = Router()

router.post('/', refreshTokenController.handleRefreshToken)

export { router as refreshTokenRouter }
