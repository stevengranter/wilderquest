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
