import { logEvents } from './logger.js'
import { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logEvents(
        `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
        'error.log'
    ).then(() => {
        console.error(err.stack)
    })

    const status = res.statusCode ? res.statusCode : 500 // rest-server error

    res.status(status)
    res.json({ message: err.message })
    next()
}

export default errorHandler
