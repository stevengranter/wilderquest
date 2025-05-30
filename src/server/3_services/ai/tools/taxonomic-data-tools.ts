import { tool } from 'ai'
import { z } from 'zod'
import axios from 'axios'

export const getINatTaxonData = tool({
    description: 'Get taxon data from iNaturalist database using common or scientific name',
    parameters: z.object({
        common_name: z.string().min(3),
    }),
    execute: async ({ common_name: name }) => {
        try {
            console.log('Fetching taxon data for:', name)

            const encodedName = encodeURIComponent(name)
            const results = await axios.get(`https://api.inaturalist.org/v1/taxa?q=${encodedName}&per_page=20`)


            console.log('Axios response:', results)

            if (results.status === 200 && results.data.results.length > 0) {
                // const { id, name } = results.data.results[0];
                // return { id, name };
                return results.data.results[0]
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
    description: 'Get observation data from iNaturalist database using location (latitude, longitude) and/or taxon_id. By default, results are listed by created date, with most recent results first.',
    parameters: z.object({
        lat: z.string().min(2).optional().describe('Latitude'),
        lng: z.string().min(2).optional().describe('Longitude'),
        taxon_id: z.number().min(1).optional().describe('Taxon ID'),
    }),
    execute: async ({ lat, lng, taxon_id }) => {
        try {
            console.log('Fetching observation data...')

            // Build query parameters dynamically
            const params: Record<string, string> = {}
            if (lat) params.lat = lat
            if (lng) params.lng = lng
            if (taxon_id !== undefined) params.taxon_id = taxon_id.toString()

            const queryString = new URLSearchParams(params).toString()
            const url = `https://api.inaturalist.org/v1/observations?${queryString}`

            const results = await axios.get(url)

            console.log('Axios response:', results)

            if (results.status === 200 && results.data.results.length > 0) {
                return results.data.results
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


