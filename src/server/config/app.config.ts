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

    // Admin User Variables
    ADMIN_USERNAME: z.string(),
    ADMIN_EMAIL: z.string(),
    ADMIN_PASSWORD: z.string(),

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

    // Extract missing variables from Zod error
    const missingVars = result.error.issues
        .filter(
            (issue) =>
                issue.code === 'invalid_type' && issue.received === 'undefined'
        )
        .map((issue) => issue.path[0])

    if (missingVars.length > 0) {
        console.error('📋 Missing required environment variables:')
        const varDescriptions: Record<string, string> = {
            MYSQL_DATABASE: 'Your MySQL database name (e.g., wilderquest_db)',
            MYSQL_USER: 'Your MySQL database user (e.g., wilderquest_user)',
            MYSQL_PASSWORD: 'Your MySQL database password',
            ADMIN_USERNAME: 'Admin username (e.g., admin)',
            ADMIN_PASSWORD: 'Admin password',
            ADMIN_EMAIL: 'Admin email address',
            REDIS_URL: 'Redis connection URL (e.g., redis://localhost:6379)',
            ACCESS_TOKEN_SECRET:
                'JWT access token secret (use a strong random string)',
            REFRESH_TOKEN_SECRET:
                'JWT refresh token secret (use a different strong random string)',
            MAP_TILES_API_KEY:
                'API key for map tiles service (get from ThunderForest)',
        }

        missingVars.forEach((varName) => {
            console.error(
                `  ❌ ${varName}: ${varDescriptions[varName] || 'Required environment variable'}`
            )
        })
        console.error('')
    }

    console.error(result.error.format())
    throw new Error('Invalid environment configuration')
}

const env = result.data
export default env
