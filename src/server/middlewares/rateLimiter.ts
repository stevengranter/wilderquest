import rateLimit, { type RateLimitExceededEventHandler } from 'express-rate-limit'
import type { Request, RequestHandler, Response } from 'express'

const DEFAULT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX = 60 // limit each IP to 60 requests per windowMs

// DDoS protection: Very aggressive limits for suspicious patterns
export const ddosProtectionLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 20, // 20 requests per 10 seconds
    message: {
        error: 'Too Many Requests',
        message: 'Request rate too high. Please slow down.',
        retryAfter: 10,
    },
    handler: ((req: Request, res: Response) => {
        res.set('Retry-After', '10')
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'Request rate too high. Please slow down.',
            retryAfter: 10,
        })
    }) as unknown as RateLimitExceededEventHandler,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests from rate limiting
    skipSuccessfulRequests: true,
    // Skip failed requests from rate limiting
    skipFailedRequests: false,
}) as unknown as RequestHandler

export const rateLimiter = (
    windowMs: number = DEFAULT_WINDOW_MS,
    max: number = DEFAULT_MAX
): RequestHandler =>
    rateLimit({
        windowMs,
        max,
        // Set Retry-After header when rate limited
        handler: ((req: Request, res: Response) => {
            const resetTime = new Date(Date.now() + windowMs)
            res.set('Retry-After', Math.ceil(windowMs / 1000).toString())
            res.set('X-RateLimit-Reset', resetTime.toISOString())
            res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
                retryAfter: Math.ceil(windowMs / 1000),
            })
        }) as unknown as RateLimitExceededEventHandler,
        // Include rate limit headers in all responses
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }) as unknown as RequestHandler
