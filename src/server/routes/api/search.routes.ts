import { search } from '../../controllers/search.controller.js'
import { Router } from 'express'

const router = Router()

router.get('/', search)

export { router as searchRouter }
