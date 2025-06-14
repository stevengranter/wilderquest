import { format } from 'date-fns'
import { v4 as uuid } from 'uuid'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import path from 'path'
import { SCRIPT_DIR } from '../constants.js'
import { type Request, type Response, type NextFunction } from 'express'

export const logEvents = async (message: string, logFileName: string) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss')
    const logItem = `${dateTime}\t${uuid()}\t${message}`

    try {
        if (!fs.existsSync(path.join(SCRIPT_DIR, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(SCRIPT_DIR, '..', 'logs'))
        } else {
            await fsPromises.appendFile(
                path.join(SCRIPT_DIR, '..', 'logs', logFileName),
                logItem
            )
        }
    } catch (err) {
        console.error(err)
    }
}

const logger = (req: Request, res: Response, next: NextFunction) => {
    logEvents(
        `${req.method}\t${req.url}\t${req.headers.origin}\t`,
        'access.log'
    ).then(() => {
        console.log(`${req.method} ${req.path}`)
    })
    next()
}

export default logger
