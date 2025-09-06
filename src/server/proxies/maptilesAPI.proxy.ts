import 'dotenv/config'
import axios from 'axios'
import chalk from 'chalk'
import { NextFunction, type Request, type Response } from 'express'
import { globalThunderForestRateLimiter } from '../utils/rateLimiterGlobal.js'
import { serverDebug } from '../../shared/utils/debug.js'

const MAP_TILES_API_KEY = process.env.MAP_TILES_API_KEY
const TILE_PROVIDER_BASE_URL = 'https://tile.thunderforest.com/atlas/'

// --- Tile Proxy Route ---

const mapTilesProxy = async (
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const tilePath = req.url
    const tileProviderUrl = `${TILE_PROVIDER_BASE_URL}/${tilePath}?apikey=${MAP_TILES_API_KEY}`

    serverDebug.api('Proxying tile request to: %s', tileProviderUrl)

    try {
        await globalThunderForestRateLimiter.consume('global')
    } catch (_error) {
        // Rate limit exceeded - set Retry-After header
        const status = await globalThunderForestRateLimiter.get('global')
        const msBeforeNext = status?.msBeforeNext ?? 2592000000 // Default to 30 days
        const retryAfterSeconds = Math.ceil(msBeforeNext / 1000)

        serverDebug.api(
            'Global ThunderForest rate limit exceeded. Retry after: %ss',
            retryAfterSeconds
        )

        return res
            .status(429)
            .set({
                'Retry-After': retryAfterSeconds.toString(),
                'X-RateLimit-Reset': new Date(
                    Date.now() + msBeforeNext
                ).toISOString(),
                'X-RateLimit-Limit': '150000',
                'X-RateLimit-Remaining': '0',
            })
            .json({
                error: 'Too Many Requests',
                message:
                    'Global map tiles API rate limit exceeded. Please try again later.',
                retryAfter: retryAfterSeconds,
            })
    }

    const status = await globalThunderForestRateLimiter.get('global')
    const used = 150_000 - (status?.remainingPoints ?? 0)
    const remaining = status?.remainingPoints ?? 0
    serverDebug.api('ThunderForest API: Used=%s, Remaining=%s', used, remaining)
    const ms = status?.msBeforeNext ?? 0
    const days = ms / 1000 / 60 / 60 / 24
    serverDebug.api('ThunderForest API: Resets in %s days', days.toFixed(2))

    const response = await axios.get(tileProviderUrl, {
        responseType: 'arraybuffer',
        headers: {
            'User-Agent': 'Node.js Express Tile Proxy',
        },
    })

    if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type'])
    }
    if (response.headers['cache-control']) {
        res.setHeader('Cache-Control', response.headers['cache-control'])
    }

    res.send(response.data)
}

export default mapTilesProxy
