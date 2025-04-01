import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

export const SCRIPT_DIR = path.dirname(__filename)
export const VIEWS_DIR =
    process.env.NODE_ENV === 'production'
        ? path.resolve(SCRIPT_DIR, '../views')
        : path.resolve(SCRIPT_DIR, '../views')
