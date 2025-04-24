import axios from 'axios'

const API_URL = '/api/iNatAPI/taxa'

export default async function fetchSearchResults({
                                                     query,
                                                     pageParam = 1,
                                                 }: {
    query: string
    pageParam?: number
}): Promise<ApiResponse> {
    if (!query || query.length < 2) {
        return {results: [], page: 1, per_page: 20, total_results: 0}
    }
    const {data} = await axios.get<ApiResponse>(API_URL, {
        params: {
            q: query,
            page: pageParam,
            per_page: 20,
        },
    })
    return data
}
