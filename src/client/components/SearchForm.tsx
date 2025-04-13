import React, {useState, useCallback} from 'react';
import {QueryClient} from "@tanstack/react-query";
import axios from "axios";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input"; // Keep if Autocomplete uses it internally, otherwise maybe remove
import {Button} from "@/components/ui/button";
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import _, {debounce} from 'lodash'; // Import debounce

import {
    Form,
    FormControl,
    FormDescription, FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group";
import {Autocomplete} from "@/components/ui/autocomplete"; // Make sure path is correct


const API_URL = "/api/iNatAPI/taxa/autocomplete"; // Base URL

// Define the expected structure of an autocomplete suggestion item from your API
interface SuggestionItem {
    value: string; // Example property
    label: string; // Example property - the text you want to display and use
    // Add other properties returned by your API if needed
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

// Define the expected structure of the API response
interface ApiResponse {
    results: iNatTaxaResponse[];
    // Add other potential response fields if necessary
}

// Updated function to fetch results - returns the array of suggestions
const getSearchResults = async (searchTerm: string): Promise<iNatTaxaResponse[]> => {
    if (!searchTerm || searchTerm.length < 2) { // Don't search for empty or very short strings
        return [];
    }
    try {
        // Use params for cleaner query string construction
        const {data} = await axios.get<ApiResponse>(API_URL, {
            params: {q: searchTerm, rank: "species"}
        });
        return data.results || []; // Return the results array or an empty array
    } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
        return []; // Return empty array on error
    }
};

// Use string enums for compatibility with zod
const searchTypes = {
    LOCATION: "LOCATION",
    PHOTO: "PHOTO",
} as const;

const formSchema = z.object({
    searchText: z.string().min(2, { // Keep validation, but selection might bypass initial minLength
        message: "Search text must be at least 2 characters.",
    }),
    searchType: z.enum(searchTypes), // Use nativeEnum for const objects
});

export default function SearchForm() {
    // State for Autocomplete's internal input and suggestions
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            searchText: "",
            searchType: searchTypes.LOCATION, // Use the enum value
        },
    });

    // Debounced function to fetch suggestions
    const debouncedFetchSuggestions = useCallback(
        debounce(async (query: string) => {
            setIsLoading(true);
            const results = await getSearchResults(query);
            console.log(results)
            const formattedResults = results.map((result) => {
                return {
                    value: result.id.toString(),
                    label: result.name,
                    common_name: _.startCase(_.camelCase(result.preferred_common_name)),
                    photo_url: result.default_photo?.square_url
                }
            })
            setSuggestions(formattedResults);
            setIsLoading(false);
        }, 500), // 500ms delay
        []
    );

    // Handler for when the user types in the Autocomplete input
    const handleSearchValueChange = (value: string) => {
        setInputValue(value); // Update local state for the input's value
        // Trigger the debounced fetch only if the value is long enough
        if (value.length >= 2) {
            debouncedFetchSuggestions(value);
        } else {
            setSuggestions([]); // Clear suggestions if input is too short
        }
    };

    // Handler for when the user selects an item from the Autocomplete suggestions
    // This needs to update the React Hook Form state
    const handleSelectedValueChange = (selectedItem: SuggestionItem | null, fieldOnChange: (value: string) => void) => {
        if (selectedItem) {
            const selectedValue = selectedItem.label; // Extract the string value you need
            fieldOnChange(selectedValue); // Update RHF's state for 'searchText'
            setInputValue(selectedValue); // Update the visual input value
            setSuggestions([]); // Clear suggestions after selection
        } else {
            // Handle case where selection is cleared (if applicable)
            fieldOnChange('');
            setInputValue('');
        }
    };

    // Form submission handler
    async function onSubmit(data: z.infer<typeof formSchema>) {
        console.log("Form Submitted:", data);
        // You might not need getSearchResults here anymore if the goal
        // is just to submit the selected 'searchText' and 'searchType'
        // const results = await getSearchResults(data.searchText);
        // console.log(results);

        // Perform actions with the submitted data (e.g., navigate, API call)
    }

    return (
        <Form {...form}>
            {/* Pass form.handleSubmit and onSubmit */}
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                    control={form.control}
                    name='searchText'
                    render={({field}) => ( // field contains { onChange, onBlur, value, name, ref }
                        <FormItem>
                            <FormLabel>Search Text</FormLabel>
                            <FormControl>
                                <Autocomplete
                                    // --- Autocomplete Specific Props ---
                                    // Value typed by the user
                                    searchValue={inputValue}
                                    onSearchValueChange={handleSearchValueChange}

                                    // Value selected from suggestions (pass RHF value for consistency if needed)
                                    // This prop might not be strictly necessary if Autocomplete primarily uses searchValue
                                    selectedValue={field.value} // Pass RHF value

                                    // Function called when an item is selected
                                    onSelectedValueChange={(selectedItem) => handleSelectedValueChange(selectedItem, field.onChange)}

                                    // Items to display in the dropdown
                                    items={suggestions}

                                    // Function to convert an item object to a display string (IMPORTANT!)
                                    // Adjust 'item.name' based on your actual suggestion object structure
                                    // itemToString={(item) => item ? item.name : ''}

                                    placeholder='Search iNaturalist Taxa...'
                                    // isLoading={isLoading} // Optional: Pass loading state if Autocomplete supports it

                                    // --- React Hook Form Props ---
                                    // Pass necessary props from RHF's field render prop
                                    name={field.name}
                                    // onBlur={field.onBlur} // Important for validation triggers
                                    // ref={field.ref}     // Important for focus management
                                />
                            </FormControl>
                            <FormDescription>
                                Type to search for species or other taxa.
                            </FormDescription>
                            <FormMessage/> {/* Shows validation errors */}
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name='searchType'
                    render={({field}) => (
                        <FormItem className='space-y-2'> {/* Added space-y-2 */}
                            <FormLabel>Search Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange} // Connect to RHF
                                    defaultValue={field.value}    // Set default from RHF
                                    className='flex flex-row space-x-4' // Changed to row layout
                                >
                                    <FormItem className='flex items-center space-x-2'>
                                        <FormControl>
                                            {/* Use values from your enum/const */}
                                            <RadioGroupItem value={searchTypes.LOCATION} id='r1'/>
                                        </FormControl>
                                        <FormLabel htmlFor='r1'
                                                   className='font-normal cursor-pointer'>Location</FormLabel>
                                    </FormItem>
                                    <FormItem className='flex items-center space-x-2'>
                                        <FormControl>
                                            <RadioGroupItem value={searchTypes.PHOTO} id='r2'/>
                                        </FormControl>
                                        <FormLabel htmlFor='r2' className='font-normal cursor-pointer'>Photo</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <Button type='submit' disabled={form.formState.isSubmitting || isLoading}>
                    {form.formState.isSubmitting || isLoading ? "Searching..." : "Submit"}
                </Button>
            </form>
        </Form>
    );
}
