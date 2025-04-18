import {useState, useEffect} from "react";
import {useDebounce} from "@/hooks/useDebounce";
import axios from "axios";
import _ from "lodash";

const API_URL = "/api/iNatAPI/taxa/autocomplete";

async function fetchSearchResults(query: string): Promise<iNatTaxaResponse[]> {
    if (!query || query.length < 2) { // Don't search for empty or very short strings
        return [];
    }
    try {
        // Use params for cleaner query string construction
        const {data} = await axios.get<ApiResponse>(API_URL, {
            params: {q: query, rank: "species"}
        });
        return data.results || []; // Return the results array or an empty array
    } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
        return []; // Return empty array on error
    }
};


export default function SearchBox() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>(() => []);
    const [iNatData, setINatData] = useState<iNatTaxaResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);


    const debouncedQuery = useDebounce(query, 300); // Debounce by 300ms


    useEffect(() => {
        if (debouncedQuery.trim() === "") {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        fetchSearchResults(debouncedQuery)
            .then((results) => {
                const formattedResults = results.map((result) => {
                    return {
                        value: result.id.toString(),
                        name: result.name,
                        common_name: _.startCase(_.camelCase(result.preferred_common_name)),
                        photo_url: result.default_photo?.square_url
                    }

                })
                setINatData(results)
                setSuggestions(formattedResults);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch suggestions:", err);
                setLoading(false);
            });

    }, [debouncedQuery]);


    return (
        <div className='p-4'>
            <input
                type='text'
                value={query}
                onChange={(e) => {
                    console.log(`e.target.value: ${e.target.value}`)
                    setQuery(e.target.value);
                    setHighlightedIndex(-1); // Reset highlight when typing
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
                            setQuery(suggestions[highlightedIndex].common_name);
                            setSuggestions([]); // Close dropdown after selection
                        }
                    }
                }}
                placeholder='Search animals...'
                className='border p-2 rounded w-full'
            />


            {query && (
                <ul className='border mt-2 rounded bg-white shadow'>
                    {loading ? (
                        <li className='p-2 text-gray-400 italic'>Loading...</li>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((item, index) => (
                            <li
                                key={item.value}
                                className={`p-2 cursor-pointer ${
                                    index === highlightedIndex ? "bg-blue-100" : "hover:bg-gray-100"
                                }`}
                                onMouseEnter={() => setHighlightedIndex(index)} // nice: hover updates highlight
                                onMouseDown={() => {
                                    setQuery(item.common_name);
                                    setSuggestions([]);
                                }}
                            >
                                {item.common_name}
                            </li>
                        ))
                    ) : null
                        //     (
                        //     <li className="p-2 text-gray-400">No results found</li>
                        // )
                    }
                </ul>

            )}
            <div>
                {iNatData && iNatData.map((item, index) => (
                    <li className='flex flex-col items-left space-y-2 p-2 border-b border-gray-200' key={index}
                        onClick={() => setQuery(item.name)} style={{cursor: "pointer"}}>
                        <div className='flex flex-row items-center space-x-2'>
                            <img src={item.default_photo?.square_url} alt={item.name}
                                 className='w-12 h-12 rounded-full'/>
                            <div>
                                <h3 className='font-bold'>{_.startCase(_.camelCase(item.preferred_common_name))}</h3>
                                <h4 className='italic'>{item.name}</h4>
                            </div>
                        </div>
                    </li>
                ))}
            </div>
        </div>
    );
}

type iNatTaxaResponse = {
    "id": number,
    "rank": "species" | "genus" | "family" | "order" | "class" | "phylum" | "kingdom",
    "rank_level": number,
    "iconic_taxon_id": number,
    "ancestor_ids": number[],
    "is_active": boolean,
    "name": string,
    "parent_id": number,
    "ancestry": string,
    "extinct": boolean,
    "default_photo": {
        "id": number,
        "license_code": string | null,
        "attribution": string,
        "url": string,
        "original_dimensions": {
            "height": number,
            "width": number
        },
        "flags": [],
        "square_url": string,
        "medium_url": string,
    },
    "taxon_changes_count": number,
    "taxon_schemes_count": number,
    "observations_count": number,
    "flag_counts": {
        "resolved": number,
        "unresolved": number
    },
    "current_synonymous_taxon_ids": number | null,
    "atlas_id": number,
    "complete_species_count": null,
    "wikipedia_url": string,
    "matched_term": string,
    "iconic_taxon_name": string,
    "preferred_common_name": string
}


interface ApiResponse {
    results: iNatTaxaResponse[];
}

interface SuggestionItem {
    value: string;
    name: string;
    common_name: string;
    photo_url: string | null;
}
