import { tool } from 'ai'
import { z } from 'zod'
import axios from 'axios'
import {
    INatObservation,
    INatTaxon,
} from '../../../../shared/types/iNatTypes.js'

export const displayTaxonomicData = tool({
    description:
        'Display cards containing species information from iNaturalist using either common name, scientific name or an array of taxon IDs',
    parameters: z
        .object({
            name: z
                .string()
                .min(3)
                .optional()
                .describe('Common name or scientific name'),
            taxon_ids: z
                .array(z.number())
                .nonempty()
                .optional()
                .describe(
                    'List of Taxon IDs from iNaturalist, separated by commas'
                ),
        })
        .refine((data) => data.name || data.taxon_ids, {
            message: 'You must provide either a common name or taxon IDs',
        }),
    execute: async ({ name, taxon_ids }) => {
        try {
            let results

            if (name) {
                console.log('Fetching taxon data by name:', name)
                const encodedName = encodeURIComponent(name)
                // Use internal proxy instead of direct API call for rate limiting and caching
                results = await axios.get(
                    `http://localhost:3000/api/iNatAPI/taxa?q=${encodedName}&per_page=20`
                )
            } else if (taxon_ids) {
                console.log('Fetching taxon data by IDs:', taxon_ids)
                const idList = taxon_ids.join(',')
                // Use internal proxy instead of direct API call for rate limiting and caching
                results = await axios.get(
                    `http://localhost:3000/api/iNatAPI/taxa?per_page=20&id=${idList}`
                )
            } else {
                return { error: 'No valid input provided' }
            }

            if (results.status === 200 && results.data.results.length > 0) {
                const simplifiedResults = results.data.results.map(
                    (result: INatTaxon) => {
                        return {
                            id: result.id,
                            name: result.name,
                            default_photo: result.default_photo,
                            rank: result.rank,
                            rank_level: result.rank_level,
                            wikipedia_url: result.wikipedia_url,
                            preferred_common_name: result.preferred_common_name,
                            extinct: result.extinct,
                            ancestry: result.ancestry,
                            observations_count: result.observations_count,
                        }
                    }
                )
                return simplifiedResults
            } else {
                return { error: 'No matching taxa found' }
            }
        } catch (error) {
            console.error('Error fetching taxon data:', error)
            return { error: 'Failed to fetch taxon data' }
        }
    },
})

export const getINatObservationData = tool({
    description:
        'Get observation data from iNaturalist using location (latitude, longitude) and/or one or more taxon_ids. Results are sorted by most recent by default.',
    parameters: z.object({
        lat: z.string().min(2).optional().describe('Latitude'),
        lng: z.string().min(2).optional().describe('Longitude'),
        radius: z.number().min(0).optional().describe('Radius in kilometers'),
        taxon_ids: z
            .array(z.number().min(1))
            .optional()
            .describe('List of Taxon IDs'),
    }),
    execute: async ({ lat, lng, taxon_ids, radius }) => {
        try {
            console.log('Fetching observation data...')

            // Build query parameters dynamically
            const params: Record<string, string> = {}
            if (lat) params.lat = lat
            if (lng) params.lng = lng
            if (lat && lng) params.radius = (radius || 100).toString()
            if (taxon_ids && taxon_ids.length > 0) {
                params.taxon_id = taxon_ids.join(',') // API supports comma-separated taxon IDs
            }

            const queryString = new URLSearchParams(params).toString()
            // Use internal proxy instead of direct API call for rate limiting and caching
            const url = `http://localhost:3000/api/iNatAPI/observations?${queryString}`

            const results = await axios.get(url)

            console.log('Axios response:', results)

            if (results.status === 200 && results.data.results.length > 0) {
                const simplifiedResults = results.data.results.map(
                    (result: INatObservation) => ({
                        id: result.id,
                        species_guess: result.species_guess,
                        location: result.location,
                        taxon: result.taxon,
                        user: result.user,
                        created_at: result.created_at,
                    })
                )
                return simplifiedResults
            } else {
                console.warn('No results found or bad response status')
                return { error: 'No matching observations found' }
            }
        } catch (error) {
            console.error('Error fetching observation data:', error)
            return { error: 'Failed to fetch observation data' }
        }
    },
})
