// utils/asyncHandler.ts
import { NextFunction, Request, Response } from 'express'

export function asyncHandler<
    T extends (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => Promise<unknown>,
>(fn: T) {
    return (req: Request, res: Response, next: NextFunction) =>
        fn(req, res, next).catch(next)
}
