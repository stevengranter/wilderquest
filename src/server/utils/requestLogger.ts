import { Request } from 'express'
import logger from '../config/logger.js'

/**
 * Utility function for consistent request context logging
 * Extracts and logs common request information for debugging rate limiting and performance issues
 */
export const logRequestContext = (
    req: Request,
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    extra?: Record<string, unknown>
) => {
    const context = {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        query: req.query,
        timestamp: new Date().toISOString(),
        ...extra,
    }

    switch (level) {
        case 'debug':
            logger.debug(message, context)
            break
        case 'info':
            logger.info(message, context)
            break
        case 'warn':
            logger.warn(message, context)
            break
        case 'error':
            logger.error(message, context)
            break
    }
}

/**
 * Logs request start for performance monitoring
 */
export const logRequestStart = (req: Request, operation: string) => {
    logRequestContext(req, `Request started: ${operation}`, 'debug', {
        operation,
        startTime: Date.now(),
    })
}

/**
 * Logs request completion with duration
 */
export const logRequestComplete = (
    req: Request,
    operation: string,
    startTime: number,
    statusCode?: number
) => {
    const duration = Date.now() - startTime
    logRequestContext(req, `Request completed: ${operation}`, 'debug', {
        operation,
        duration: `${duration}ms`,
        statusCode,
    })
}

/**
 * Logs slow requests that exceed a threshold
 */
export const logSlowRequest = (
    req: Request,
    operation: string,
    duration: number,
    threshold: number = 1000
) => {
    if (duration > threshold) {
        logRequestContext(req, `Slow request detected: ${operation}`, 'warn', {
            operation,
            duration: `${duration}ms`,
            threshold: `${threshold}ms`,
        })
    }
}
