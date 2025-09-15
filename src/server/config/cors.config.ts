import { CorsOptions } from 'cors'

const allowedOrigins = [
    // 'https://wildernest.fly.dev',
    'https://wilderquest.fly.dev',
    'https://localhost:3000',
    'https://localhost:5173'
]

const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            // allow non-browser requests like Postman or curl
            return callback(null, true)
        }

        const isLocalhost = origin.startsWith('http://localhost');
        const isAllowed = allowedOrigins.includes(origin) || isLocalhost;

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
}

export default corsConfig
