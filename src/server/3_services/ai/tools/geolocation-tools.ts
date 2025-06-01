import { tool } from 'ai'
import { z } from 'zod'
import { getForwardGeocode, getReverseGeocode } from '../../geoCodingService.js'

export const getUserLocationTool = tool({
    description: 'Get user location via browser (requires permission)',
    parameters: z.object({
        message: z.string().describe('The message to ask for confirmation.'),
    }),

})

export const getLocationByIPTool = tool({
    description: 'Get approximate user location based on IP address (less accurate but no permission required)',
    parameters: z.object({
        ipAddress: z.string().optional(), // If not provided, will use user's current IP
    }),
    execute: async ({ ipAddress }) => {
        try {
            // Using ipapi.co (free tier: 1000 requests/day)
            const url = ipAddress
                ? `https://ipapi.co/${ipAddress}/json/`
                : `https://ipapi.co/json/`

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                return { error: data.reason || 'IP location lookup failed' }
            }

            return {
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
                city: data.city,
                region: data.region,
                country: data.country_name,
                countryCode: data.country_code,
                postalCode: data.postal,
                timezone: data.timezone,
                isp: data.org,
                accuracy: 'city-level', // IP-based location is typically city-level accurate
                source: 'ip-geolocation',
            }

        } catch (error) {
            console.error('Error fetching IP location:', error)
            return { error: 'Failed to get location from IP address' }
        }
    },
})

// Alternative using different IP geolocation service
export const getLocationByIP2Tool = tool({
    description: 'Get user location using alternative IP geolocation service (ipinfo.io)',
    parameters: z.object({
        token: z.string().optional(), // API token for higher limits
    }),
    execute: async ({ token }) => {
        try {
            const url = token
                ? `https://ipinfo.io/json?token=${token}`
                : `https://ipinfo.io/json`

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()

            if (data.error) {
                return { error: data.error.message || 'IP location lookup failed' }
            }

            // Parse the "lat,lng" format from ipinfo.io
            const [latitude, longitude] = data.loc ? data.loc.split(',').map(Number) : [null, null]

            return {
                latitude,
                longitude,
                city: data.city,
                region: data.region,
                country: data.country,
                postalCode: data.postal,
                timezone: data.timezone,
                isp: data.org,
                accuracy: 'city-level',
                source: 'ip-geolocation-ipinfo',
            }

        } catch (error) {
            console.error('Error fetching IP location:', error)
            return { error: 'Failed to get location from IP address' }
        }
    }
})

export const reverseGeocodeTool = tool({
    description: 'Get the nearest city, state, and country from latitude and longitude coordinate data',
    parameters: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }),
    execute: async ({ latitude, longitude }) => {
        try {
            console.log('Fetching location data for: ', latitude, longitude)
            const location = getReverseGeocode(latitude.toString(), longitude.toString())
            console.log('Location found: ', location)

            if (location) {
                // const { id, name } = results.data.results[0];
                // return { id, name };
                return location
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

export const forwardGeocodeTool = tool({
    description: 'Get the latitude and longitude for a given address',
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
