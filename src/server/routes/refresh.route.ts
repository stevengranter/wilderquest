import {Router} from 'express'
import refreshTokenController from '../controllers/refreshToken.controller.js'

const router = Router()

router.post('/', refreshTokenController.handleRefreshToken)

export {router as refreshTokenRouter}
