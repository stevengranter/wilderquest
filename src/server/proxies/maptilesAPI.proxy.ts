import 'dotenv/config'
import axios from 'axios'
import { NextFunction, type Request, type Response } from 'express'

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

    console.log(`Proxying tile request to: ${tileProviderUrl}`)

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
