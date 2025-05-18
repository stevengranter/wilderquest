import { Request, Response, RequestHandler } from 'express'
import { getForwardGeocode, getReverseGeocode } from '../3_services/geoCodingService.js'

const getGeoCodeForward: RequestHandler = async (
    req: Request,
    res: Response,
) => {
    const city = req.query.city

    if (!city || typeof city !== 'string') {
        res.status(400).json({ error: 'City parameter is required and must be a string' })
        return
    }

    try {
        const result = await getForwardGeocode(city)
        if (!result) {
            res.status(404).json({ error: 'Location not found' })
            return
        }
        res.status(200).json(result)
        return
    } catch (error) {
        console.error('Geocoding error:', error)
        res.status(500).json({ error: 'Internal server error' })
        return
    }
}

const getGeoCodeReverse: RequestHandler = async (req: Request, res: Response) => {
    const latitude = req.query.lat
    const longitude = req.query.lon

    if (!latitude || !longitude) {
        res.status(400).json({
            error: 'Missing latitude or longitude parameters',
        })
        return
    }

    if (Array.isArray(latitude) || Array.isArray(longitude)) {
        res.status(400).json({
            error: 'Latitude and longitude must be single values',
        })
        return
    }

    try {
        const result = await getReverseGeocode(latitude, longitude)
        if (!result) {
            res.status(404).json({
                error: 'Location not found',
            })
            return
        }
        res.status(200).json(result)
        return
    } catch (error) {
        console.error('Geocoding error:', error)
        res.status(500).json({
            error: 'Internal server error',
        })
        return
    }
}


export { getGeoCodeForward, getGeoCodeReverse }
