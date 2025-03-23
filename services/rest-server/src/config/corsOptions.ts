import allowedOrigins from './allowedOrigins.js'
import { CorsOptions } from 'cors'

const corsOptions: CorsOptions = {
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

export default corsOptions
