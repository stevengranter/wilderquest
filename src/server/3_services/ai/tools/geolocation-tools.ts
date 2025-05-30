import { tool } from 'ai'
import { z } from 'zod'
import { getForwardGeocode } from '../../geoCodingService.js'

export const getGeoLocationResults = tool({
    description: 'Get possible geolocation results for a given address',
    parameters: z.object({
        address: z.string().min(3),
    }),
    execute: async ({ address: address }) => {
        try {
            console.log('Fetching taxon data for:', address)

            // const encodedAddress = encodeURIComponent(address)
            const results = await getForwardGeocode(address)


            console.log('Results', results)

            if (results) {
                // const { id, name } = results.data.results[0];
                // return { id, name };
                return results
            } else {
                console.warn('No results found or bad response status')
                return { error: 'No matching  geolocation found' }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            return { error: 'Failed to fetch data' }
        }
    },
})
