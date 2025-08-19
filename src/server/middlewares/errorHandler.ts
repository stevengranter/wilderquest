import { type ErrorRequestHandler, type NextFunction, type Request, type Response } from 'express'
import logger from '../config/logger.js'

// Define a general error interface that includes the custom statusCode property
interface HttpError extends Error {
    statusCode?: number
}

const errorHandler: ErrorRequestHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // Construct a detailed error message
    const errorMessage = `${req.method} ${req.url} - ${err.name}: ${err.message} - Origin: ${req.headers.origin ?? 'N/A'}`

    // Log the error using Winston. This will also include the stack trace.
    // In development, this logs to the console.
    // In production, it logs to `logs/error.log` and `logs/combined.log`.
    logger.error(`${errorMessage}\n${err.stack}`)

    // Determine the HTTP status code
    // Prioritize a custom status code set on the error object (e.g., from validation)
    // Then check if a status code was already set by a previous middleware (e.g., res.status(401))
    // Otherwise, default to 500 for internal server errors
    const status = err.statusCode || res.statusCode || 500

    // IMPORTANT: Check if headers have already been sent.
    // If they have, we must *not* try to send another response.
    // Instead, we just let Express's default error handler (or the next middleware) handle it.
    if (res.headersSent) {
        return next(err) // Pass the error along to Express's default error handler
    }

    // Set the status code on the response
    res.status(status)

    // Send the JSON error response
    res.json({
        message: err.message,
        // Optionally, include a stack trace in development for debugging
        // You should typically *not* send stack traces to clients in production
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })

    // REMOVE next() here
    // Do NOT call next() after sending a response in an error handling middleware.
    // Calling next() here would try to move to the next middleware (if any),
    // but the response has already been sent, leading to the "Cannot set headers" error.
    // The response cycle for this request should end here.
};
export default errorHandler