// src/server/config/appConfig.ts
import "dotenv/config";
import {z} from "zod";

const envSchema = z.object({
    // Express app variables
    PROTOCOL: z
        .union([
            z.literal('http'),
            z.literal('https'),
        ]),
    PORT: z.coerce.number().min(1000),
    HOST: z.string(),

    // Database variables
    MYSQL_HOST: z.string(),
    MYSQL_PORT: z.coerce.number().min(1000),
    MYSQL_DATABASE: z.string(),
    MYSQL_USER: z.string(),
    MYSQL_PASSWORD: z.string(),

    // Token secret variables
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string()

})


const appConfig = envSchema.parse({
    PROTOCOL: process.env.PROTOCOL,
    PORT: process.env.PORT,
    HOST: process.env.HOST,

    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,

    // Token secret variables
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

})

export default appConfig

