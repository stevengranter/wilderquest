// * Imports * //

// External imports
import express, { Request, Response } from 'express' // Import Request, Repsonse types
import path from 'path'

// Internal imports
import ViteExpress from 'vite-express'
import errorHandler from './middlewares/errorHandler.js'

import { SCRIPT_DIR } from './constants.js'
import appConfig from './config/app.config.js'
import { initApp } from './init.js'
import { buildApp } from './app.js'


async function startServer() {
    try {
        // 🛢️ Initialise database pool and repositories via initApp()
        const deps = await initApp()

        // ☕️ Initialize routes and controllers via buildApp()
        const app = buildApp(deps)

        //  Server setup  //
        if (process.env.NODE_ENV !== 'production') {
            // Error Handler
            app.use(errorHandler)
            ViteExpress.listen(app, appConfig.PORT, () => {
                console.log(
                    `Server running on ${appConfig.PROTOCOL}://${appConfig.HOST}:${appConfig.PORT} ✅ `
                )
            })
        } else {
            const publicDir = path.join(SCRIPT_DIR, '../../dist/public')

            // Serve static files from the 'public' directory
            app.use(express.static(publicDir))

            // Handle all other 1_routes by serving 'index.html'
            app.get(['*splat'], (req: Request, res: Response) => {
                res.sendFile(path.join(publicDir, 'index.html'))
            })

            // Error Handler
            app.use(errorHandler)

            app.listen(appConfig.PORT, () => {
                console.log(
                    `Server running on ${appConfig.PROTOCOL}://${appConfig.HOST}:${appConfig.PORT} ✅ `
                ) //Log the actual port
            })
        }
        const shutdownHandler = () => {
            console.log('Shutting down server...')
            // Close database connections, etc.
            process.exit(0)
        }
        process.on('SIGTERM', shutdownHandler)
        process.on('SIGINT', shutdownHandler)
        return true
    } catch (error) {
        console.error('⛔️ Failed to start server:', error)
        process.exit(1)
    }
}

startServer().then(
    (result) => result && console.log('Server setup complete ✅ ')
)
