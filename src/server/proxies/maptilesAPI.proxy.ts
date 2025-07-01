import 'dotenv/config'
import axios from 'axios'
import { type Request, type Response } from 'express'

const MAP_TILES_API_KEY = process.env.MAP_TILES_API_KEY
const TILE_PROVIDER_BASE_URL = 'https://tile.thunderforest.com/atlas/'

// --- Tile Proxy Route ---

const mapTilesProxy = async (req: Request, res: Response) => {
    // Reconstruct the original path requested by Leaflet
    const tilePath = req.url
    let tileProviderUrl = `${TILE_PROVIDER_BASE_URL}/${tilePath}`
    tileProviderUrl += `?apikey=${MAP_TILES_API_KEY}`

    console.log(`Proxying tile request to: ${tileProviderUrl}`)

    try {
        // Fetch the tile from the third-party provider
        const response = await axios.get(tileProviderUrl, {
            responseType: 'arraybuffer', // Crucial for image data
            headers: {
                'User-Agent': 'Node.js Express Tile Proxy', // Good practice to identify your proxy
            },
        })

        // Set appropriate headers from the original response
        // This is important for caching (e.g., Cache-Control, ETag, Last-Modified)
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type'])
        }
        if (response.headers['cache-control']) {
            res.setHeader('Cache-Control', response.headers['cache-control'])
        }
        // Add other relevant headers as needed for your provider (e.g., 'Expires', 'Last-Modified')

        // Send the tile image data back to the client
        res.send(response.data)
    } catch (error) {
        console.error(`Error proxying tile ${tilePath}:`, error.message)
        if (error.response) {
            console.error(
                `Status: ${error.response.status}, Data: ${error.response.data.toString()}`
            )
            res.status(error.response.status).send(error.response.data)
        } else {
            res.status(500).send('Error fetching map tile')
        }
    }
}

export default mapTilesProxy
