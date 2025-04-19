"use client";

import {useState} from "react";
import {useDebounce} from "@/hooks/useDebounce";
import {keepPreviousData, useInfiniteQuery} from "@tanstack/react-query";
import axios from "axios";
import _ from "lodash";
import {Card, CardContent, CardSection} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {motion, AnimatePresence} from "motion/react";
import {FaWikipediaW} from "react-icons/fa";

// --- API fetcher function ---
const API_URL = "/api/iNatAPI/taxa";

async function fetchSearchResults({query, pageParam = 1}: { query: string; pageParam?: number }): Promise<ApiResponse> {
    if (!query || query.length < 2) {
        return {results: [], page: 1, per_page: 20, total_results: 0};
    }
    const {data} = await axios.get<ApiResponse>(API_URL, {
        params: {
            q: query,
            rank: "species",
            page: pageParam,
            per_page: 20,
        },
    });
    return data;
}

async function fetchWikipediaContent(title: string) {
    try {
        const {data} = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        return {
            extract: data.extract,
            image: data.thumbnail?.source || null,
            fullUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        };
    } catch (error) {
        console.error("Failed to fetch Wikipedia content:", error);
        return null;
    }
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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedItem, setSelectedItem] = useState<iNatTaxaResponse | null>(null);
    const [wikiContent, setWikiContent] = useState<{
        extract: string;
        image: string | null;
        fullUrl: string;
    } | null>(null);

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
        queryFn: ({pageParam}) => fetchSearchResults({query: debouncedQuery, pageParam}),
        getNextPageParam: (lastPage) => {
            const {page, per_page, total_results} = lastPage;
            const totalPages = Math.ceil(total_results / per_page);
            if (page < totalPages) {
                return page + 1;
            } else {
                return undefined;
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

    const handleSelect = async (item: SuggestionItem) => {
        setQuery(item.common_name);
        setShowSuggestions(false);
        const selected = allResults.find((r) => r.id.toString() === item.value) || null;
        setSelectedItem(selected);

        if (selected?.wikipedia_url) {
            const title = selected.wikipedia_url.split("/").pop() || selected.name;
            const content = await fetchWikipediaContent(title);
            setWikiContent(content);
        } else {
            setWikiContent(null);
        }
    };

    return (
        <div className='p-4 relative'>
            {/* Search Input */}
            <Input
                type='text'
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
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
                            setShowSuggestions(false);
                        }
                    }
                }}
                placeholder='Search species by name or common name...'
                className='border p-2 rounded w-full'
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />

            {/* Suggestions Dropdown */}
            {query && showSuggestions && (
                <ul className='border mt-0 rounded absolute z-10 text-primary-900 w-full bg-opacity-80 bg-primary-200 shadow'>
                    {isLoading ? (
                        <li className='p-2 text-gray-400 italic'>Loading...</li>
                    ) : isError ? (
                        <li className='p-2 text-red-400 italic'>Error fetching suggestions</li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((item, index) => (
                            <li
                                key={item.value}
                                className={`p-2 cursor-pointer ${index === highlightedIndex ? "bg-blue-800 text-primary-100" : "hover:bg-blue-300"}`}
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

            {/* Main Display */}
            <AnimatePresence mode='wait'>
                {selectedItem ? (
                    <>
                        <motion.div
                            key='selected'
                            initial={{opacity: 0, x: 100}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -100}}
                            transition={{duration: 0.5}}
                            className='flex flex-col md:flex-row gap-4 mt-4'
                        >
                            {/* Selected Card */}
                            <div className='w-full md:w-1/3'>
                                <Card className='p-0 m-0'>
                                    <CardSection>
                                        {selectedItem.default_photo?.medium_url && (
                                            <img
                                                src={selectedItem.default_photo.medium_url}
                                                alt={selectedItem.name}
                                                className='w-full rounded-t-md object-cover aspect-square'
                                            />
                                        )}
                                    </CardSection>
                                    <CardContent className='p-4 pt-2'>
                                        <h3 className='font-bold text-xl'>{_.startCase(_.camelCase(selectedItem.preferred_common_name))}</h3>
                                        <h4 className='italic'>{selectedItem.name}</h4>
                                        <div className='text-xs'>Matched term: {selectedItem.matched_term}</div>
                                        <div>Observations: <Badge>{selectedItem.observations_count}</Badge></div>


                                    </CardContent>
                                </Card>

                            </div>

                            {/* Wikipedia Custom View */}
                            <div className='w-full md:w-2/3 bg-white p-6 rounded border-1 '>
                                {wikiContent ? (
                                    <>
                                        <FaWikipediaW size={"2em"}/>
                                        {wikiContent.image && (
                                            <img src={wikiContent.image} alt='Wikipedia'
                                                 className='w-full max-h-60 object-contain mb-4 rounded'/>
                                        )}
                                        <h2 className='text-2xl font-bold mb-2'>{_.startCase(_.camelCase(selectedItem.preferred_common_name))}</h2>
                                        <p className='text-gray-700 mb-4'>{wikiContent.extract}</p>
                                        <a
                                            href={wikiContent.fullUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-blue-500 underline'
                                        >
                                            Read full article on Wikipedia →
                                        </a>
                                    </>
                                ) : (
                                    <p className='text-gray-400 italic'>No Wikipedia content available.</p>
                                )}

                            </div>

                        </motion.div>
                        <Button className='mt-4 w-full' variant='reverse' onClick={() => {
                            setSelectedItem(null);
                            setWikiContent(null);
                        }}>
                            Back to search
                        </Button>
                    </>
                ) : (
                    <motion.ul
                        key='grid'
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4'
                    >
                        {filteredResults.map((item, index) => (
                            <Card
                                key={index}
                                className={cn("p-0 m-0 cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-2")}
                                onClick={async () => {
                                    setSelectedItem(item);
                                    setShowSuggestions(false);

                                    if (item.wikipedia_url) {
                                        const title = item.wikipedia_url.split("/").pop() || item.name;
                                        const content = await fetchWikipediaContent(title);
                                        setWikiContent(content);
                                    } else {
                                        setWikiContent(null);
                                    }
                                }}
                            >
                                <CardSection>
                                    {item.default_photo?.medium_url && (
                                        <img
                                            src={item.default_photo.medium_url}
                                            alt={item.name}
                                            className='w-full rounded-t-md object-cover aspect-square'
                                        />
                                    )}
                                </CardSection>
                                <CardContent className='p-4 pt-2'>
                                    <h3 className='font-bold text-xl'>{_.startCase(_.camelCase(item.preferred_common_name))}</h3>
                                    <h4 className='italic'>{item.name}</h4>
                                    <div>Observations: <Badge>{item.observations_count}</Badge></div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>

            {/* Load More Button */}
            {hasNextPage && !selectedItem && (
                <div className='flex justify-center mt-6'>
                    <Button
                        onClick={() => fetchNextPage()}
                        variant='reverse'
                        disabled={isFetchingNextPage}
                        className='w-full px-4 py-2 mt-4 border rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                    >
                        {isFetchingNextPage ? "Loading more..." : "Load More"}
                    </Button>
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
        original_dimensions: { height: number; width: number; };
        flags: [];
        square_url: string;
        medium_url: string;
    };
    taxon_changes_count: number;
    taxon_schemes_count: number;
    observations_count: number;
    flag_counts: { resolved: number; unresolved: number; };
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
    observations_count: number;
}
