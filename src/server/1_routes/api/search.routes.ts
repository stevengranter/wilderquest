import { search } from '../../2_controllers/search.controller.js'
import { Router } from 'express'

const router = Router()

router.get('/', search)

export { router as searchRouter }
