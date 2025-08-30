// src/server/proxies/wikipediaAPI.proxy.ts
import { Request, Response } from 'express'
import axios from 'axios'
import { getWithRetry } from '../utils/retryWithBackoff.js'
import logger from '../config/logger.js'

const WIKIPEDIA_API_BASE_URL = 'https://en.wikipedia.org/api/rest_v1'

export default async (req: Request, res: Response) => {
    const path = req.path.replace('/wikipedia', '') // Remove /wikipedia prefix
    const query = new URLSearchParams(
        req.query as Record<string, string>
    ).toString()
    const url = `${WIKIPEDIA_API_BASE_URL}${path}${query ? `?${query}` : ''}`

    logger.info('Proxying to Wikipedia:', url)

    try {
        const response = await getWithRetry(url)

        // Forward the response
        res.status(response.status)
        res.set(response.headers)
        res.json(response.data)
    } catch (error) {
        logger.error('Wikipedia API proxy error:', error)
        if (axios.isAxiosError(error)) {
            res.status(error.response?.status || 500).json({
                error: 'Wikipedia API request failed',
                details: error.message,
            })
        } else {
            res.status(500).json({
                error: 'Internal server error',
                details: 'Failed to proxy Wikipedia API request',
            })
        }
    }
}
