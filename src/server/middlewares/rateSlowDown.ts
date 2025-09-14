import { slowDown } from 'express-slow-down'
import type { RequestHandler } from 'express'
import { logRequestContext } from '../utils/requestLogger.js'

export const rateSlowDown = slowDown({
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 20, // Allow 20 requests without delay
    delayMs: (hits, req) => {
        const delay = hits * 100 // Add 100 ms of delay per request after delayAfter
        logRequestContext(
            req,
            `Rate slow down applied: ${delay}ms delay (hit #${hits})`,
            'info',
            {
                hits,
                delayMs: delay,
            }
        )
        return delay
    },
}) as unknown as RequestHandler
