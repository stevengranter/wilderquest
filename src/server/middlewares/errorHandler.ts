import { type ErrorRequestHandler, type NextFunction, type Request, type Response } from 'express'
import { ZodError } from 'zod'
import logger from '../config/logger.js'

// Optional custom error class
export class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

interface HttpError extends Error {
    statusCode?: number;
    code?: string; // for mysql2 error codes
    errno?: number;
}

const errorHandler: ErrorRequestHandler = (err: HttpError | AppError | ZodError, req: Request, res: Response, next: NextFunction) => {
    const errorMessage = `${req.method} ${req.url} - ${err.name}: ${err.message} - Origin: ${req.headers.origin ?? 'N/A'}`;
    logger.error(`${errorMessage}\n${err.stack}`);

    let status: number;
    let message: string;

    if (err instanceof ZodError) {
        // Validation errors → 400
        status = 400;
        message = err.errors.map(e => `${e.path.join('.')} - ${e.message}`).join('; ');
    } else if (err instanceof AppError) {
        // Custom AppError → use statusCode
        status = err.statusCode;
        message = err.message;
    } else if (err.code) {
        // mysql2 errors
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                status = 409; // Conflict
                message = 'Duplicate entry';
                break;
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_ROW_IS_REFERENCED_2':
                status = 400; // Bad Request for foreign key issues
                message = 'Invalid reference';
                break;
            default:
                status = 500;
                message = err.message;
        }
    } else {
        // Fallback
        status = err.statusCode || res.statusCode || 500;
        message = err.message || 'Internal Server Error';
    }

    if (res.headersSent) {
        return next(err);
    }

    res.status(status).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
