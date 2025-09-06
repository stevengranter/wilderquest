import { Request, Response, RequestHandler } from 'express'
import axios from 'axios'
import {
    getForwardGeocode,
    getReverseGeocode,
} from '../services/geoCodingService.js'
import {
    LocationIQResults,
    LocationIQPlace,
} from '../../shared/types/api/locationIQ.js'
import { INatPlacesAutocompleteResponse } from '../../shared/types/api/iNaturalist.js'

interface INatPlaceAutocompleteResult {
    id: number
    name: string
    display_name: string
    type: string
    place_type: number
    latitude?: number
    longitude?: number
}

const getGeoCodeForward: RequestHandler = async (
    req: Request,
    res: Response
) => {
    const city = req.query.city

    if (!city || typeof city !== 'string') {
        res.status(400).json({
            error: 'City parameter is required and must be a string',
        })
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

const getGeoCodeReverse: RequestHandler = async (
    req: Request,
    res: Response
) => {
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
        const result = await getReverseGeocode(
            latitude.toString(),
            longitude.toString()
        )
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

const getCombinedLocationSearch: RequestHandler = async (
    req: Request,
    res: Response
) => {
    const query = req.query.q

    if (!query || typeof query !== 'string') {
        res.status(400).json({
            error: 'Query parameter is required and must be a string',
        })
        return
    }

    if (query.length < 2) {
        res.status(200).json([])
        return
    }

    try {
        const results: Array<{
            place_id: string
            display_name: string
            lat: string
            lon: string
            source: 'locationiq' | 'inaturalist'
            type?: string
            place_type?: number
        }> = []

        // Fetch from LocationIQ
        try {
            const locationIQResult = await getForwardGeocode(query)
            if (locationIQResult && Array.isArray(locationIQResult)) {
                const locationIQPlaces = locationIQResult
                    .slice(0, 5)
                    .map((place: LocationIQPlace) => ({
                        place_id: place.place_id,
                        display_name: place.display_name,
                        lat: place.lat,
                        lon: place.lon,
                        source: 'locationiq' as const,
                        type: place.type,
                    }))
                results.push(...locationIQPlaces)
            }
        } catch (error) {
            console.warn('LocationIQ search failed:', error)
        }

        // Fetch from iNaturalist places
        try {
            const iNatResponse =
                await axios.get<INatPlacesAutocompleteResponse>(
                    `https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(query)}&per_page=5`
                )

            if (iNatResponse.data && iNatResponse.data.results) {
                const iNatPlaces = iNatResponse.data.results.map(
                    (place: INatPlaceAutocompleteResult) => ({
                        place_id: place.id.toString(),
                        display_name: place.display_name,
                        lat: place.latitude?.toString() || '',
                        lon: place.longitude?.toString() || '',
                        source: 'inaturalist' as const,
                        type: place.type,
                        place_type: place.place_type,
                    })
                )
                results.push(...iNatPlaces)
            }
        } catch (error) {
            console.warn('iNaturalist places search failed:', error)
        }

        // Remove duplicates based on display_name similarity
        const uniqueResults = results.filter(
            (result, index, self) =>
                index ===
                self.findIndex(
                    (r) =>
                        r.display_name
                            .toLowerCase()
                            .includes(
                                result.display_name.toLowerCase().split(',')[0]
                            ) ||
                        result.display_name
                            .toLowerCase()
                            .includes(
                                r.display_name.toLowerCase().split(',')[0]
                            )
                )
        )

        res.status(200).json(uniqueResults.slice(0, 10))
        return
    } catch (error) {
        console.error('Combined location search error:', error)
        res.status(500).json({ error: 'Internal server error' })
        return
    }
}

const getNearbyLocations: RequestHandler = async (
    req: Request,
    res: Response
) => {
    const latitude = req.query.lat
    const longitude = req.query.lon

    if (!latitude || !longitude) {
        res.status(400).json({
            error: 'Latitude and longitude parameters are required',
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
        const lat = parseFloat(latitude.toString())
        const lon = parseFloat(longitude.toString())

        if (isNaN(lat) || isNaN(lon)) {
            res.status(400).json({
                error: 'Invalid latitude or longitude values',
            })
            return
        }

        const results: Array<{
            place_id: string
            display_name: string
            lat: string
            lon: string
            source: 'locationiq' | 'inaturalist'
            type?: string
            place_type?: number
        }> = []

        // Fetch from LocationIQ with nearby search
        try {
            const locationIQUrl = `https://us1.locationiq.com/v1/nearby?key=${process.env.LOCATIONIQ_KEY}&lat=${lat}&lon=${lon}&radius=50000&format=json&limit=7`
            const locationIQResponse = await axios.get(locationIQUrl)

            if (
                locationIQResponse.data &&
                Array.isArray(locationIQResponse.data)
            ) {
                const locationIQPlaces = locationIQResponse.data
                    .slice(0, 7)
                    .map((place: any) => ({
                        place_id: place.place_id || `${place.lat},${place.lon}`,
                        display_name:
                            place.display_name ||
                            place.name ||
                            'Nearby Location',
                        lat: place.lat.toString(),
                        lon: place.lon.toString(),
                        source: 'locationiq' as const,
                        type: place.type,
                    }))
                results.push(...locationIQPlaces)
            }
        } catch (error) {
            console.warn('LocationIQ nearby search failed:', error)
        }

        // Fetch from iNaturalist places - use autocomplete with location bias
        try {
            // Use a broader search term to find places near the location
            const searchTerms = ['park', 'nature', 'reserve', 'forest', 'trail']
            const iNatPromises = searchTerms
                .slice(0, 3)
                .map((term) =>
                    axios.get<INatPlacesAutocompleteResponse>(
                        `https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(term)}&per_page=3`
                    )
                )

            const iNatResponses = await Promise.all(iNatPromises)

            for (const response of iNatResponses) {
                if (response.data && response.data.results) {
                    const iNatPlaces = response.data.results
                        .filter((place: INatPlaceAutocompleteResult) => {
                            // Filter places that are roughly near the user's location
                            if (place.latitude && place.longitude) {
                                const distance = Math.sqrt(
                                    Math.pow(place.latitude - lat, 2) +
                                        Math.pow(place.longitude - lon, 2)
                                )
                                return distance < 1 // Roughly within ~70 miles
                            }
                            return false
                        })
                        .map((place: INatPlaceAutocompleteResult) => ({
                            place_id: place.id.toString(),
                            display_name: place.display_name,
                            lat: place.latitude?.toString() || '',
                            lon: place.longitude?.toString() || '',
                            source: 'inaturalist' as const,
                            type: place.type,
                            place_type: place.place_type,
                        }))
                    results.push(...iNatPlaces)
                }
            }
        } catch (error) {
            console.warn('iNaturalist nearby places search failed:', error)
        }

        // Remove duplicates based on display_name similarity
        const uniqueResults = results.filter(
            (result, index, self) =>
                index ===
                self.findIndex(
                    (r) =>
                        r.display_name
                            .toLowerCase()
                            .includes(
                                result.display_name.toLowerCase().split(',')[0]
                            ) ||
                        result.display_name
                            .toLowerCase()
                            .includes(
                                r.display_name.toLowerCase().split(',')[0]
                            )
                )
        )

        res.status(200).json(uniqueResults.slice(0, 10))
        return
    } catch (error) {
        console.error('Nearby locations search error:', error)
        res.status(500).json({ error: 'Internal server error' })
        return
    }
}

export {
    getGeoCodeForward,
    getGeoCodeReverse,
    getCombinedLocationSearch,
    getNearbyLocations,
}
