declare module 'compression' {
    import { Request, Response, RequestHandler } from 'express'

    interface CompressionOptions {
        level?: number
        threshold?: number | string
        filter?: (req: Request, res: Response) => boolean
    }

    interface CompressionFunction {
        (options?: CompressionOptions): RequestHandler
        filter: (req: Request, res: Response) => boolean
    }

    const compression: CompressionFunction
    export = compression
}
