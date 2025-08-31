import { slowDown } from 'express-slow-down'
import type { RequestHandler } from 'express'

export const rateSlowDown = slowDown({
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 20, // Allow 1 request per second
    delayMs: (hits) => hits * 100, // Add 100 ms of delay to every request after the 5th one.
}) as unknown as RequestHandler
