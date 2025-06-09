'use client'

import type React from 'react'

import FilterController from '@/components/search/FilterController'
import { ResultsGrid } from '@/components/search/ResultsGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { INatObservation, INatTaxon } from '../../../shared/types/iNatTypes'
import ViewModeController from '@/components/search/ViewModeController'


// interface Observation {
//     id: number;
//     // Add other observation properties you expect
//     species_guess: string;
//     // ...
// }
//
// interface Taxon {
//     id: number;
//     // Add other taxon properties you expect
//     name: string;
//     // ...
// }

// Your API fetching function, now dynamic
const fetchINaturalistData = async (type: string, query: string): Promise<any> => {
    let endpoint = ''
    switch (type) {
        case 'species':
            endpoint = 'taxa' // iNaturalist API for species search is /taxa
            break
        case 'observations':
            endpoint = 'observations'
            break
        default:
            endpoint = 'observations' // Default to observations
    }

    const apiUrl = `https://api.inaturalist.org/v1/${endpoint}`
    const url = new URL(apiUrl)

    if (query) {
        if (type === 'species') {
            url.searchParams.append('q', query)
        } else {
            url.searchParams.append('q', query)
        }
    }
    url.searchParams.append('per_page', '10') // Default limit

    // You might also need to append other filters from searchParams later
    // For example, if FilterController adds filters to the URL, you'd merge them here.

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url.toString()}: ${response.statusText}`)
    }
    const data = await response.json()
    return data
}

export default function SearchInterface() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [viewMode, setViewMode] = useState('grid')

    // Initialize state from URL params
    const [searchCategory, setSearchCategory] = useState(searchParams.get('type') || 'observations') // Default to 'observations'
    const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '')

    // Effect to synchronize local state with URL on initial load and URL changes
    useEffect(() => {
        setSearchCategory(searchParams.get('type') || 'observations')
        setLocalQuery(searchParams.get('q') || '')
    }, [searchParams])

    // This object holds the parameters that affect the data fetching.
    // It's crucial for the `queryKey`.
    const queryParamsForFetch = {
        type: searchCategory, // This will determine the endpoint
        q: localQuery,    // This is the search term
        // Add other URL parameters that your API call might depend on,
        // e.g., 'page', 'filters', etc., extracted from searchParams.
        // For simplicity, we're just using type and q here.
    }

    const { data, isLoading, isError, error } = useQuery({
        // The queryKey uniquely identifies the data.
        // When any part of this array changes, React Query knows to re-fetch.
        queryKey: ['inaturalist', queryParamsForFetch.type, queryParamsForFetch.q],
        // The queryFn now calls your dynamic fetcher
        queryFn: () => fetchINaturalistData(queryParamsForFetch.type, queryParamsForFetch.q),
        // `enabled` ensures the query only runs when `localQuery` is not empty
        // if `q` is mandatory for your API calls.
        enabled: !!queryParamsForFetch.q, // Only fetch if `q` is not empty
        // Optional: Keep previous data while fetching new data for smoother transitions
        placeholderData: (previousData) => previousData, // Use this instead
        // Refetch on mount only if new query key is different from last successful one
        refetchOnMount: 'always', // Or 'stale' depending on desired behavior
        // You might want to adjust staleTime, cacheTime based on iNaturalist API rate limits and data freshness needs
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Update URL search parameters. This will automatically trigger the useQuery refetch.
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('type', searchCategory)
        newSearchParams.set('q', localQuery)
        setSearchParams(newSearchParams)
    }

    return (
        <div className='space-y-4'>
            {/* Search form */}
            <form onSubmit={handleSubmit} className='flex gap-2'>
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger className='w-40'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='species'>Species</SelectItem>
                        <SelectItem value='observations'>Observations</SelectItem>
                        {/* <SelectItem value='collections'>Collections</SelectItem> */}
                    </SelectContent>
                </Select>
                <Input
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder={`Search ${searchCategory}...`}
                    className='flex-1'
                />
                <Button type='submit'>
                    <Search className='h-4 w-4' />
                </Button>
            </form>

            {/* Filter controller */}
            <FilterController />

            {/* Display Results */}
            {isLoading && <div>Loading...</div>}
            {isError && <div>Error: {error?.message}</div>}
            {data && (
                <div>
                    <h2>Results for "{localQuery}" ({searchCategory}):</h2>
                    <p>Total results: {data.total_results}</p>
                    {/* You'll need to map over data.results or data.data depending on iNat's response structure */}
                    {data.results && data.results.length > 0 ? (
                        <ul>
                            {data.results.map((item: INatTaxon | INatObservation) => (
                                <li key={item.id}>
                                    {/* Adjust how you display based on `searchCategory` */}
                                    {searchCategory === 'species' ? (item as INatTaxon).name : (item as INatObservation).species_guess}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No results found.</p>
                    )}
                </div>
            )}

            {/* The `ResultsGrid` component would then ideally consume `data`, `isLoading`, etc.
                It might be better to pass these props down or have ResultsGrid internally
                use a React Query hook if it's a very specialized component. */}
            <ViewModeController viewMode={viewMode} setViewMode={setViewMode} />
            <ResultsGrid searchCategory={searchCategory} viewMode={viewMode} data={data} />
        </div>
    );
}
