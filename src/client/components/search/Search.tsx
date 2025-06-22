'use client'

import { useCallback, useEffect, useState } from 'react' // Import useCallback
import { ResultsGrid } from '@/components/search/ResultsGrid'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import ViewModeController from '@/components/search/ViewModeController'
import SearchCategorySelect, {
    SearchCategory,
} from '@/components/search/SearchCategorySelect'
import SearchAutoComplete from '@/components/SearchAutoComplete'
import { useSearchContext } from '@/contexts/search/SearchContext'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import { fetchINaturalistData } from '@/components/search/fetchINaturalistData' // Corrected import path for SelectionContext

export default function SearchInterface() {
    const [searchParams, setSearchParams] = useSearchParams()
    const searchCategory = searchParams.get('category') || 'observations'
    const { viewMode, setViewMode, results, setResults } = useSearchContext()
    const { isSelectionMode, setIsSelectionMode } = useSelectionContext()
    const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '')
    // New state to hold the selected item from SearchAutoComplete
    const [selectedTaxaItem, setSelectedTaxaItem] =
        useState<iNatTaxaResult | null>(null)

    // Effect to synchronize local state with URL on initial load and URL changes
    useEffect(() => {
        const queryFromUrl = searchParams.get('q') || ''
        setLocalQuery(queryFromUrl)
        // If the query from the URL changes, it might mean a new search, so clear selected item.
        if (selectedTaxaItem && selectedTaxaItem.name !== queryFromUrl) {
            setSelectedTaxaItem(null)
        }
    }, [searchParams, selectedTaxaItem])

    const handleSearchCategoryChange = (newCategory: SearchCategory) => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('category', newCategory)
        newSearchParams.set('page', '1')
        setSearchParams(newSearchParams)
    }

    // Callback function to handle selection from SearchAutoComplete
    const handleAutoCompleteSelection = useCallback(
        (item: iNatTaxaResult) => {
            setSelectedTaxaItem(item)
            // Update the local query with the selected item's name
            setLocalQuery(item.name)

            // Trigger a search immediately after selection
            // by updating the URL search params
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.set('q', item.name)
            if (searchCategory === 'species' && item.id) {
                // If searching species, you might want to include the taxon_id for more precise results
                newSearchParams.set('taxon_id', item.id.toString())
            } else {
                newSearchParams.delete('taxon_id') // Clear if not a species search
            }
            setSearchParams(newSearchParams)
        },
        [searchParams, searchCategory, setSearchParams]
    )

    const queryParamsForFetch = {
        category: searchCategory,
        q: localQuery,
        taxon_id: selectedTaxaItem?.id?.toString() || undefined,
    }

    const { data, isLoading, isError, error } = useQuery({
        queryKey: [
            'inaturalist',
            queryParamsForFetch.category,
            queryParamsForFetch.q,
            queryParamsForFetch.taxon_id,
        ],
        queryFn: () =>
            fetchINaturalistData(
                queryParamsForFetch.category,
                queryParamsForFetch.q,
                queryParamsForFetch.taxon_id // Pass taxon_id to fetch function
            ),
        enabled:
            !!queryParamsForFetch.q ||
            queryParamsForFetch.category === 'observations', // Enable query for observations even without a 'q'
        placeholderData: (previousData) => previousData,
        refetchOnMount: 'always',
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })

    useEffect(() => {
        if (data) {
            setResults(data)
        }
    }, [data, setResults])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('category', searchCategory)
        newSearchParams.set('q', localQuery)
        // Ensure taxon_id is also updated or cleared on manual submission
        if (selectedTaxaItem && searchCategory === 'species') {
            newSearchParams.set('taxon_id', selectedTaxaItem.id.toString())
        } else {
            newSearchParams.delete('taxon_id')
        }
        setSearchParams(newSearchParams)
    }

    const toggleSelectMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false)
        } else {
            setIsSelectionMode(true)
        }
    }

    return (
        <div className="'pace-y-4"'
            {/* Search form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex flex-col w-full">
                    <SearchAutoComplete
                        selectionHandler={handleAutoCompleteSelection}
                        selectedItemName={localQuery} // Pass the current query to keep the input in sync
                    />
                    <SearchCategorySelect
                        searchCategory={searchCategory as SearchCategory}
                        setSearchCategory={handleSearchCategoryChange}
                    />
                </div>
                <Button type="submit">
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            {/* Filter controller */}
            {/*<FilterController />*/}

            {/* Display Results */}
            {isLoading && <div>Loading...</div>}
            {isError && <div>Error: {error?.message}</div>}
            {data && (
                <>
                    <p>Total results: {data.total_results}</p>

                    <ViewModeController
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                    <Button onClick={toggleSelectMode}>
                        Select mode: {isSelectionMode ? 'ON' : 'OFF'}
                    </Button>
                    <ResultsGrid
                        searchCategory={searchCategory}
                        viewMode={viewMode}
                        data={data}
                    />
                </>
            )}
        </div>
    )
}
