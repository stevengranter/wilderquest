import { Request, Response, RequestHandler } from 'express'
import { getForwardGeocode } from '../3_services/geoCodingService.js'

const getGeoCodeForward: RequestHandler = (
    req: Request,
    res: Response) => {
    const city = req.query.city

    getForwardGeocode(city).then(
        (result) => {
            res.status(200).json(result)
        },
    )
}


export { getGeoCodeForward }
