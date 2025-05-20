// Third party imports
import { useEffect, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import _ from 'lodash'

// Local imports
import fetchSearchResults from '@/utils/fetchSearchResults'
import { useDebounce } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'

export default function SearchAutoComplete({
    selectionHandler,
    selectedItemName,
}: {
    selectionHandler: (suggestionItem: iNatTaxaResponse) => void
    selectedItemName: string | null
}) {
    // const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 300)
    const [highlightedSuggestion, setHighlightedSuggestion] =
        useState<number>(-1)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const suggestionResult = useInfiniteQuery({
        queryKey: [debouncedQuery],
        queryFn: ({ pageParam }) =>
            fetchSearchResults({ query: debouncedQuery, pageParam }),
        getNextPageParam: (lastPage) => {
            const { page, per_page, total_results } = lastPage
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

    // const filteredResults = filterAndSortResults(allResults)

    const suggestions = suggestionResult.data?.pages.flatMap((page) => page.results) ?? []
    //     filteredResults.map((result) => ({
    //     ...result,
    //     // id: result.id.toString(),
    //     // name: result.name,
    //     // matched_term: result.matched_term,
    //     // common_name: _.startCase(_.camelCase(result.preferred_common_name)),
    //     // photo_url: result.default_photo?.square_url,
    //     // observations_count: result.observations_count,
    // }))

    useEffect(() => {
        if (selectedItemName) {
            setQuery(selectedItemName)
        }
    }, [selectedItemName])

    // async function onClick(item: SuggestionItem) {
    //     selectionHandler(item);
    //     const result = await axios.get(`/api/iNatAPI/taxa/?taxon_id=${item.id}`);
    //     setSearchResults(result.data.results);
    // }

    return (
        <>
            <div>
                {/* Search Input */}
                <Input
                    type="text"
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
                                setQuery(suggestions[highlightedSuggestion].name)
                                selectionHandler(suggestions[highlightedSuggestion])
                                setShowSuggestions(false)
                            }
                        }
                    }}
                    placeholder="Search species by name or common name..."
                    // className="mx-2"
                    onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 100)
                    }
                />

                {/* Suggestions Dropdown */}
                {query && showSuggestions && (
                    <ul className="border mt-0 rounded absolute z-10 text-primary-900 w-full bg-opacity-80 shadow">
                        {suggestionResult.isLoading ? (
                            <li className="p-2 text-gray-400 italic">
                                Loading...
                            </li>
                        ) : suggestionResult.isError ? (
                            <li className="p-2 text-red-400 italic">
                                Error fetching suggestions
                            </li>
                        ) : suggestions.length > 0 ? (
                            suggestions.map((item, index) => (
                                <li
                                    key={item.id}
                                    className={`p-2 cursor-pointer bg-background ${index === highlightedSuggestion ? 'bg-secondary-background text-primary-100' : 'hover:bg-blue-300'}`}
                                    onMouseEnter={() =>
                                        setHighlightedSuggestion(index)
                                    }
                                    onMouseDown={() => {
                                        setQuery(item.name)
                                        selectionHandler(item)
                                    }}
                                >
                                    <div className="flex flex-row items-center gap-5 w-150">
                                        <div>
                                            <img
                                                src={
                                                    item.default_photo
                                                        ?.square_url
                                                }
                                                alt={item.name}
                                                className="w-10 h-10"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <div>
                                                {_.startCase(
                                                    _.camelCase(
                                                        item.preferred_common_name
                                                    )
                                                )}
                                            </div>
                                            <div className="text-xs">
                                                {' '}
                                                {item.name}
                                            </div>
                                        </div>
                                        {item.rank}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p'2 text-gray-400 italic">
                                ' No results found
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </>
    )
}

// function filterAndSortResults(results: iNatTaxaResponse[]) {
//     return results
//         .filter((item) => {
//             const matched = item.matched_term?.toLowerCase()
//             const commonName = item.preferred_common_name?.toLowerCase() || ''
//             const scientificName = item.name?.toLowerCase() || ''
//             return (
//                 matched &&
//                 (commonName.includes(matched) ||
//                     scientificName.includes(matched))
//             )
//         })
//         .sort(
//             (a, b) => (b.observations_count || 0) - (a.observations_count || 0)
//         )
// }
