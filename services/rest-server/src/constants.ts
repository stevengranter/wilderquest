import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

export const PROTOCOL = process.env.PROTOCOL || 'http'
export const HOST = process.env.HOST || 'localhost'
export const PORT = process.env.PORT || 2500

export const SCRIPT_DIR = path.dirname(__filename)
export const VIEWS_DIR =
    process.env.NODE_ENV === 'production'
        ? path.resolve(SCRIPT_DIR, '../views')
        : path.resolve(SCRIPT_DIR, '../views')
