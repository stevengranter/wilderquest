"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/config/appConfig.ts
require("dotenv/config");
var zod_1 = require("zod");
var envSchema = zod_1.z.object({
    // Express app variables
    PROTOCOL: zod_1.z.union([zod_1.z.literal('http'), zod_1.z.literal('https')]),
    PORT: zod_1.z.coerce.number().min(1000),
    HOST: zod_1.z.string(),
    // Database variables
    MYSQL_HOST: zod_1.z.string(),
    MYSQL_PORT: zod_1.z.coerce.number().min(1000),
    MYSQL_DATABASE: zod_1.z.string(),
    MYSQL_USER: zod_1.z.string(),
    MYSQL_PASSWORD: zod_1.z.string(),
    // Token secret variables
    ACCESS_TOKEN_SECRET: zod_1.z.string(),
    REFRESH_TOKEN_SECRET: zod_1.z.string(),
});
var appConfig = envSchema.parse({
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
});
exports.default = appConfig;
