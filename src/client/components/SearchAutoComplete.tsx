// Third party imports
import {useState} from 'react'
import {keepPreviousData, useInfiniteQuery} from '@tanstack/react-query'
import _ from 'lodash'

// Local imports
import fetchSearchResults from '@/utils/fetchSearchResults'
import {useDebounce} from '@/hooks/useDebounce'
import {Input} from '@/components/ui/input'
import {Badge} from "@/components/ui/badge";

export default function SearchAutoComplete({
                                               selectionHandler,
                                           }: {
    selectionHandler: (suggestionItem: iNatTaxaResponse) => void
}) {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 300)
    const [highlightedSuggestion, setHighlightedSuggestion] =
        useState<number>(-1)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const suggestionResult = useInfiniteQuery({
        queryKey: [debouncedQuery],
        queryFn: ({pageParam}) =>
            fetchSearchResults({query: debouncedQuery, pageParam}),
        getNextPageParam: (lastPage) => {
            const {page, per_page, total_results} = lastPage
            const totalPages = Math.ceil(total_results / per_page)
            if (page < totalPages) {
                return page + 1
            } else {
                return undefined
            }
        },
        enabled: debouncedQuery.length > 1,
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    })

    const allResults =
        suggestionResult.data?.pages.flatMap((page) => page.results) ?? []
    const filteredResults = filterAndSortResults(allResults)

    const suggestions = filteredResults.map((result) => ({
        ...result,
        // id: result.id.toString(),
        // name: result.name,
        // matched_term: result.matched_term,
        // common_name: _.startCase(_.camelCase(result.preferred_common_name)),
        // photo_url: result.default_photo?.square_url,
        // observations_count: result.observations_count,

    }))

    // async function handleSelect(item: SuggestionItem) {
    //     selectionHandler(item);
    //     const result = await axios.get(`/api/iNatAPI/taxa/?taxon_id=${item.id}`);
    //     setSearchResults(result.data.results);
    // }

    return (
        <>
            <div>
                {/* Search Input */}
                <Input
                    type='text'
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setShowSuggestions(true)
                        setHighlightedSuggestion(-1)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setHighlightedSuggestion((prev) =>
                                Math.min(prev + 1, suggestions.length - 1)
                            )
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setHighlightedSuggestion((prev) =>
                                Math.max(prev - 1, 0)
                            )
                        } else if (e.key === 'Enter') {
                            if (
                                highlightedSuggestion >= 0 &&
                                highlightedSuggestion < suggestions.length
                            ) {
                                // selectionHandler(
                                //     suggestions[highlightedSuggestion]
                                // )
                                console.log(highlightedSuggestion)
                                setShowSuggestions(false)
                            }
                        }
                    }}
                    placeholder='Search species by name or common name...'
                    className='border p-2 rounded w-full'
                    onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 100)
                    }
                />

                {/* Suggestions Dropdown */}
                {query && showSuggestions && (
                    <ul className='border mt-0 rounded absolute z-10 text-primary-900 w-full bg-opacity-80 bg-primary-200 shadow'>
                        {suggestionResult.isLoading ? (
                            <li className='p-2 text-gray-400 italic'>
                                Loading...
                            </li>
                        ) : suggestionResult.isError ? (
                            <li className='p-2 text-red-400 italic'>
                                Error fetching suggestions
                            </li>
                        ) : suggestions.length > 0 ? (
                            suggestions.map((item, index) => (
                                <li
                                    key={item.id}
                                    className={`p-2 cursor-pointer ${index === highlightedSuggestion ? 'bg-blue-800 text-primary-100' : 'hover:bg-blue-300'}`}
                                    onMouseEnter={() =>
                                        setHighlightedSuggestion(index)
                                    }
                                    onMouseDown={() => selectionHandler(item)}
                                >
                                    <div className='flex flex-row justify-between'>
                                        {_.startCase(_.camelCase(item.preferred_common_name))}
                                        <Badge>{item.rank}</Badge>
                                    </div>

                                </li>
                            ))
                        ) : (
                            <li className='p-2 text-gray-400 italic'>
                                No results found
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </>
    )
}

function filterAndSortResults(results: iNatTaxaResponse[]) {
    return results
        .filter((item) => {
            const matched = item.matched_term?.toLowerCase()
            const commonName = item.preferred_common_name?.toLowerCase() || ''
            const scientificName = item.name?.toLowerCase() || ''
            return (
                matched &&
                (commonName.includes(matched) ||
                    scientificName.includes(matched))
            )
        })
        .sort(
            (a, b) => (b.observations_count || 0) - (a.observations_count || 0)
        )
}
