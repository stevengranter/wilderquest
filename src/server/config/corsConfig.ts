import { CorsOptions } from 'cors'

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://wildernest.fly.dev",
];

const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        if ((origin && allowedOrigins.indexOf(origin) !== -1) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
}

export default corsConfig
