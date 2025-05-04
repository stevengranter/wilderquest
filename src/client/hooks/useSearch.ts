import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface SearchResult {
    [key: string]: unknown
}

interface SearchResponse {
    results: SearchResult[]
}

export function useSearch(
    searchTerm: string | undefined,
    searchType: 'text' | 'image'
) {
    const requestBody =
        searchType === 'text'
            ? { type: 'text', q: searchTerm }
            : { type: 'image', image: searchTerm }

    return useQuery<SearchResult[], Error>({
        queryKey: ['search', searchType, searchTerm],
        queryFn: async () => {
            const response = await axios.post<SearchResponse>(
                '/api/search',
                requestBody
            )
            return response.data.results
        },
        enabled: !!searchTerm,
    })
}
