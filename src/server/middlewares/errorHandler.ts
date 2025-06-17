import { logEvents } from './logger.js' // Adjust path as needed
import { ErrorRequestHandler, Request, Response, NextFunction } from 'express' // Import all necessary types

// Define a general error interface that includes the custom statusCode property
interface HttpError extends Error {
    statusCode?: number;
}

const errorHandler: ErrorRequestHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // Log the error details
    logEvents(
        `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
        'error.log'
    ).then(() => {
        // Log the stack trace to the console for development debugging
        console.error(err.stack)
    }).catch(logError => {
        // Handle potential errors during logging itself
        console.error('Error logging to file:', logError)
    });

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