import 'dotenv/config'
import {z} from 'zod'

const envSchema = z.object({
    // Express app variables
    PROTOCOL: z.union([z.literal('http'), z.literal('https')]).optional(),
    PORT: z.coerce.number().min(1000).optional(),
    HOST: z.string().optional(),

    // MySQL Database variables
    MYSQL_HOST: z.string().optional(),
    MYSQL_PORT: z.coerce.number().min(1000),
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

type Environment = z.infer<typeof envSchema>

const env = envSchema.parse(process.env)

export default env
