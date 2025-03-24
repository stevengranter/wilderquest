// root.route.ts

import { Router } from 'express'
import path from 'path'
import { VIEWS_DIR } from '../constants.js'

const router = Router()

router.get('^/$|/index(.html)?', (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, 'index.html'))
})

export { router as rootRouter }
