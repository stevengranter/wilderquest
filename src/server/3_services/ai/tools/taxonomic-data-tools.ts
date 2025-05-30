import { tool } from 'ai'
import { z } from 'zod'
import axios from 'axios'

export const getINatTaxonData = tool({
    description: 'Get taxon data (including id) from iNaturalist database using common name or scientific name',
    parameters: z.object({
        common_name: z.string().min(3),
    }),
    execute: async ({ common_name: name }) => {
        try {
            console.log('Fetching taxon data for:', name)

            const encodedName = encodeURIComponent(name)
            const results = await axios.get(`https://api.inaturalist.org/v1/taxa?q=${encodedName}&per_page=20`)


            // console.log('Axios response:', results)

            if (results.status === 200 && results.data.results.length > 0) {
                // const { id, name } = results.data.results[0];
                // return { id, name };
                // return results.data.results[0]
                const simplifiedResults = results.data.results.map(result => {
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
                })
                return simplifiedResults
            } else {
                console.warn('No results found or bad response status')
                return { error: 'No matching taxa found' }
            }
        } catch (error) {
            console.error('Error fetching taxon data:', error)
            return { error: 'Failed to fetch taxon data' }
        }
    },
})


export const getINatObservationData = tool({
    description: 'Get observation data from iNaturalist using location (latitude, longitude) and/or one or more taxon_ids. Results are sorted by most recent by default.',
    parameters: z.object({
        lat: z.string().min(2).optional().describe('Latitude'),
        lng: z.string().min(2).optional().describe('Longitude'),
        radius: z.number().min(0).optional().describe('Radius in kilometers'),
        taxon_ids: z.array(z.number().min(1)).optional().describe('List of Taxon IDs'),
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
            const url = `https://api.inaturalist.org/v1/observations?${queryString}`

            const results = await axios.get(url)

            console.log('Axios response:', results)

            if (results.status === 200 && results.data.results.length > 0) {
                const simplifiedResults = results.data.results.map(result => ({
                    id: result.id,
                    species_guess: result.species_guess,
                    location: result.location,
                    taxon: result.taxon,
                    user: result.user,
                    created_at: result.created_at,
                }))
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


