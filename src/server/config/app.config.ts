import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    // Express app variables
    PROTOCOL: z.union([z.literal('http'), z.literal('https')]).default('http'),
    PORT: z.coerce.number().min(1000).default(3000),
    HOST: z.string().default('localhost'),

    // MySQL Database variables
    MYSQL_HOST: z.string().default('localhost'),
    MYSQL_PORT: z.coerce.number().min(1000).default(3306),
    MYSQL_DATABASE: z.string(),
    MYSQL_USER: z.string(),
    MYSQL_PASSWORD: z.string(),

    // Redis variables
    REDIS_URL: z.string(),

    // Token secret variables
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string(),

    // API keys
    MAP_TILES_API_KEY: z.string(),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
    console.error('❌ Invalid or missing environment variables:\n')
    console.error(result.error.format())
    process.exit(1)
}

const env = result.data
export default env
