import {
    INatObservationsResponse,
    INatTaxaResponse,
} from '../../../shared/types/iNatTypes'

export const fetchINaturalistData = async (
    category: string,
    query: string,
    taxon_id?: string
): Promise<INatTaxaResponse | INatObservationsResponse> => {
    let endpoint: string
    switch (category) {
        case 'species':
            endpoint = 'taxa' // iNaturalist API for species search is /taxa
            break
        case 'observations':
            endpoint = 'observations'
            break
        default:
            endpoint = 'species' // Default to species
    }

    const url = new URL(`/api/iNatAPI/${endpoint}`, window.location.origin)

    if (category === 'species' && taxon_id) {
        url.searchParams.append('taxon_id', taxon_id) // Add taxon_id for species search
    } else if (query) {
        url.searchParams.append('q', query)
    }

    if (category === 'observations') {
        // For observations we only want observations that have a identified taxon
        //  (so taxon.id can be populated)
        url.searchParams.append('identified', 'true')
        url.searchParams.append('photos', 'true')
    }

    url.searchParams.append('per_page', '30') // Default limit

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(
            `Failed to fetch data from ${url.toString()}: ${response.statusText}`
        )
    }
    return await response.json()
}
