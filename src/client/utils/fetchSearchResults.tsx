import axios from 'axios'
import { INatAutocompleteResponse } from '@shared/types'

const API_URL = '/api/iNatAPI/taxa/autocomplete'

export default async function fetchSearchResults({
    query,
    pageParam = 1,
}: {
    query: string
    pageParam?: number
}): Promise<INatAutocompleteResponse> {
    if (!query || query.length < 2) {
        return { results: [], page: 1, per_page: 20, total_results: 0 }
    }
    const { data } = await axios.get<INatAutocompleteResponse>(API_URL, {
        params: {
            q: query,
            page: pageParam,
            per_page: 20,
        },
    })
    return data
}
