import {useState} from "react";
import {useDebounce} from "@/hooks/useDebounce";
import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import axios from "axios";
import _ from "lodash";
import {Card, CardContent, CardSection} from "@/components/ui/card";
import {cn} from "@/lib/utils";

// --- API fetcher function ---
const API_URL = "/api/iNatAPI/taxa";

async function fetchSearchResults({query, pageParam = 1}: { query: string; pageParam?: number }): Promise<ApiResponse> {
    if (!query || query.length < 2) {
        return {results: [], page: 1, per_page: 20, total_results: 0};
    }
    console.log(`fetching ${query} page ${pageParam}`)
    const {data} = await axios.get<ApiResponse>(API_URL, {
        params: {
            q: query,
            rank: "species",
            page: pageParam,
            per_page: 20,
        },
    });
    console.log(`fetched ${query} page ${pageParam}`)
    console.log(data)
    return data;
}


function filterAndSortResults(results: iNatTaxaResponse[]) {
    return results
        .filter((item) => {
            const matched = item.matched_term?.toLowerCase();
            const commonName = item.preferred_common_name?.toLowerCase() || "";
            const scientificName = item.name?.toLowerCase() || "";
            return matched && (commonName.includes(matched) || scientificName.includes(matched));
        })
        .sort((a, b) => (b.observations_count || 0) - (a.observations_count || 0));
}

// --- Main Component ---
export default function SearchBox() {
    const [query, setQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const debouncedQuery = useDebounce(query, 300);

    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: [debouncedQuery],
        queryFn: ({pageParam}) => {
            console.log(`pageParam: ${pageParam} query: ${debouncedQuery}`)
            return fetchSearchResults({query: debouncedQuery, pageParam})
        },
        getNextPageParam: (lastPage) => {
            const {page, per_page, total_results} = lastPage;
            const totalPages = Math.ceil(total_results / per_page);
            console.log(`totalPages: ${totalPages}, page: ${page}, per_page: ${per_page}, total_results: ${total_results}`)
            if (page < totalPages) {
                return page + 1; // Fetch the next page
            } else {
                return undefined; // No more pages
            }
        },
        enabled: debouncedQuery.length > 1,
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData,
    });


    const allResults = data?.pages.flatMap((page) => page.results) ?? [];
    const filteredResults = filterAndSortResults(allResults);

    const suggestions = filteredResults.map((result) => ({
        value: result.id.toString(),
        name: result.name,
        matched_term: result.matched_term,
        common_name: _.startCase(_.camelCase(result.preferred_common_name)),
        photo_url: result.default_photo?.square_url,
        observations_count: result.observations_count,
    }));

    const handleSelect = (item: SuggestionItem) => {
        setQuery(item.common_name);
    };

    return (
        <div className='p-4'>
            {/* Search Input */}
            <input
                type='text'
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                    } else if (e.key === "Enter") {
                        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                            handleSelect(suggestions[highlightedIndex]);
                        }
                    }
                }}
                placeholder='Search animals...'
                className='border p-2 rounded w-full'
            />

            {/* Suggestions Dropdown */}
            {query && (
                <ul className='border mt-2 rounded bg-white shadow'>
                    {isLoading ? (
                        <li className='p-2 text-gray-400 italic'>Loading...</li>
                    ) : isError ? (
                        <li className='p-2 text-red-400 italic'>Error fetching suggestions</li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((item, index) => (
                            <li
                                key={crypto.randomUUID()}
                                // key={item.value}
                                className={`p-2 cursor-pointer ${
                                    index === highlightedIndex ? "bg-blue-100" : "hover:bg-gray-100"
                                }`}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onMouseDown={() => handleSelect(item)}
                            >
                                {item.common_name}
                            </li>
                        ))
                    ) : (
                        <li className='p-2 text-gray-400 italic'>No results found</li>
                    )}
                </ul>
            )}

            {/* Full Results Display */}
            <ul className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6'>
                {filteredResults.map((item, index) => (
                    <Card
                        key={index}
                        className={cn("p-0 m-0")}
                        onClick={() => setQuery(item.name)}
                        style={{cursor: "pointer"}}
                    >
                        <CardSection>
                            {item.default_photo?.square_url && (
                                <img
                                    src={item.default_photo.square_url}
                                    alt={item.name}
                                    className='w-full'
                                />
                            )}
                        </CardSection>
                        <CardContent className='p-4 pt-2'>
                            <div>
                                <h3 className='font-bold'>{_.startCase(_.camelCase(item.preferred_common_name))}</h3>
                                <h4 className='italic'>{item.name}</h4>
                                <div className='text-xs'>Matched term: {item.matched_term}</div>
                            </div>
                            <div>Observations: {item.observations_count}</div>
                        </CardContent>
                    </Card>
                ))}
            </ul>

            {/* Load More Button */}
            {hasNextPage && (
                <div className='flex justify-center mt-6'>
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className='px-4 py-2 mt-4 border rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load More"}
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Types ---
type iNatTaxaResponse = {
    id: number;
    rank: "species" | "genus" | "family" | "order" | "class" | "phylum" | "kingdom";
    rank_level: number;
    iconic_taxon_id: number;
    ancestor_ids: number[];
    is_active: boolean;
    name: string;
    parent_id: number;
    ancestry: string;
    extinct: boolean;
    default_photo?: {
        id: number;
        license_code: string | null;
        attribution: string;
        url: string;
        original_dimensions: {
            height: number;
            width: number;
        };
        flags: [];
        square_url: string;
        medium_url: string;
    };
    taxon_changes_count: number;
    taxon_schemes_count: number;
    observations_count: number;
    flag_counts: {
        resolved: number;
        unresolved: number;
    };
    current_synonymous_taxon_ids: number | null;
    atlas_id: number;
    complete_species_count: null;
    wikipedia_url: string;
    matched_term: string;
    iconic_taxon_name: string;
    preferred_common_name: string;
};

interface ApiResponse {
    results: iNatTaxaResponse[];
    per_page: number;
    page: number;
    total_results: number;
}

interface SuggestionItem {
    value: string;
    name: string;
    common_name: string;
    photo_url: string | undefined;
}
