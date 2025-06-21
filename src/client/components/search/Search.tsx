'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react' // Import useCallback
import { ResultsGrid } from '@/components/search/ResultsGrid'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import ViewModeController from '@/components/search/ViewModeController'
import { INatObservationsResponse, INatTaxaResponse } from '../../../shared/types/iNatTypes'
import SearchCategorySelect, { SearchCategory } from '@/components/search/SearchCategorySelect'
import SearchAutoComplete from '@/components/SearchAutoComplete'
import { useSearchContext } from '@/contexts/search/SearchContext'
import { Card, CardContent } from '@/components/ui/card'
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'
import { Collection } from '../../../types/types'
import api from '@/api/api'
import { useReward } from 'react-rewards'

// Your API fetching function, now dynamic
const fetchINaturalistData = async (category: string, query: string, taxon_id?: string): Promise<INatTaxaResponse | INatObservationsResponse> => {
    let endpoint: string
    switch (category) {
        case 'species':
            endpoint = 'taxa' // iNaturalist API for species search is /taxa
            break
        case 'observations':
            endpoint = 'observations'
            break
        default:
            endpoint = 'species' // Default to species
    }

    const url = new URL(`/api/iNatAPI/${endpoint}`, window.location.origin)


    if (category === 'species' && taxon_id) {
        url.searchParams.append('taxon_id', taxon_id) // Add taxon_id for species search
    } else if (query) {
        url.searchParams.append('q', query)
    }

    url.searchParams.append('per_page', '30') // Default limit

    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url.toString()}: ${response.statusText}`)
    }
    return await response.json()
}

export default function SearchInterface() {
    const [searchParams, setSearchParams] = useSearchParams()
    const searchCategory = searchParams.get('category') || 'observations'
    const { viewMode, setViewMode, selectedIds, results, setResults } = useSearchContext()
    const [selectModeOn, setSelectModeOn] = useState<boolean>(false)
    const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '')
    // New state to hold the selected item from SearchAutoComplete
    const [selectedTaxaItem, setSelectedTaxaItem] = useState<iNatTaxaResult | null>(null)


    // Effect to synchronize local state with URL on initial load and URL changes
    useEffect(() => {
        const queryFromUrl = searchParams.get('q') || ''
        setLocalQuery(queryFromUrl)
        // If the query from the URL changes, it might mean a new search, so clear selected item.
        if (selectedTaxaItem && selectedTaxaItem.name !== queryFromUrl) {
            setSelectedTaxaItem(null)
        }
    }, [searchParams, selectedTaxaItem]);


    const handleSearchCategoryChange = (newCategory: SearchCategory) => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set('category', newCategory)
        newSearchParams.set('page', '1')
        setSearchParams(newSearchParams)
    }

    // Callback function to handle selection from SearchAutoComplete
    const handleAutoCompleteSelection = useCallback((item: iNatTaxaResult) => {

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

    }, [searchParams, searchCategory, setSearchParams])


    const queryParamsForFetch = {
        category: searchCategory,
        q: localQuery,
        taxon_id: selectedTaxaItem?.id?.toString() || undefined,
    }

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['inaturalist', queryParamsForFetch.category, queryParamsForFetch.q, queryParamsForFetch.taxon_id],
        queryFn: () => fetchINaturalistData(queryParamsForFetch.category, queryParamsForFetch.q),
        enabled: !!queryParamsForFetch.q,
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
        if (selectModeOn) {
            setSelectModeOn(false)
        } else {
            setSelectModeOn(true)
        }
    }

    return (
        <div className='space-y-4'>
            {/* Search form */}
            <form onSubmit={handleSubmit} className='flex gap-2'>
                <div className='flex flex-col w-full'>
                    <SearchAutoComplete
                        selectionHandler={handleAutoCompleteSelection}
                        selectedItemName={localQuery} // Pass the current query to keep the input in sync
                    />
                    <SearchCategorySelect
                        searchCategory={searchCategory as SearchCategory}
                        setSearchCategory={handleSearchCategoryChange} />
                </div>
                <Button type='submit'>
                    <Search className='h-4 w-4' />
                </Button>
            </form>

            {/* Filter controller */}
            {/*<FilterController />*/}


            {/* Display Results */}
            {isLoading && <div>Loading...</div>}
            {isError && <div>Error: {error?.message}</div>}
            {data && (<>
                    <p>Total results: {data.total_results}</p>


                    <SelectionToolbar selectedIds={selectedIds} />
                    <ViewModeController viewMode={viewMode} setViewMode={setViewMode} />
                    <Button onClick={toggleSelectMode}>Select mode: {(selectModeOn) ? 'ON' : 'OFF'}</Button>
                    <ResultsGrid searchCategory={searchCategory} viewMode={viewMode} data={data} />
                </>
            )}
        </div>
    )
}

function SelectionToolbar() {
    const { results, selectedIds, _setSelectedIds, _removeIdFromSelection } = useSearchContext()

    const selectedResults = useMemo(() => {
        if (!results) return []
        const resultsArray = results.results.filter(result => selectedIds.includes(result.id.toString()))
        return resultsArray
    }, [selectedIds, results])

    useEffect(() => {
        console.log('Selected IDs:', selectedIds)
        console.log('Results:', results)
        console.log(results)
    }, [selectedIds])


    function handleAddAllToCollection() {
        console.log('handleAddAllToCollection not yet implemented')
    }

    return (
        <div>
            <div className='flex'>Selected items: {selectedResults.map(result => <MiniCard data={result}
                                                                                           className='w-32 h-auto' />)}</div>

            <CollectionPicker />
        </div>
    )
}


function CollectionPicker() {
    const [collections, setCollections] = useState<Collection[]>([])
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
    const [currentEmoji, setCurrentEmoji] = useState('🙌')

    const { reward, isAnimating } = useReward('rewardId', 'emoji', {
        emoji: [currentEmoji],
        // rotate: false,
        elementCount: 30,
        spread: 60,
        lifetime: 100,
    })

    useEffect(() => {
        api.get(`/collections/mine`).then(res => setCollections(res.data))
    }, [])

    useEffect(() => {
        if (selectedCollection?.emoji) {
            setCurrentEmoji(selectedCollection.emoji)
        }
    }, [selectedCollection])

    const handleAddAllToCollection = () => {
        // console.log('Selected collection: ', selectedCollection)

        // Delay to next frame so layout settles before animation starts
        requestAnimationFrame(() => {
            reward()
        })
    }

    return (
        <>

            <Button>Open Collections Drawer</Button>

            <div id='rewardId' className='ml-20'></div>
            <CollectionSelect
                collections={collections}
                setCollections={setCollections}
                selectedCollection={selectedCollection}
                setSelectedCollection={setSelectedCollection}
            />
            <Button disabled={isAnimating} onClick={handleAddAllToCollection}>
                Add all to collection
            </Button>


        </>
    )
}


function CollectionSelect({
                              collections,
                              selectedCollection,
                              setSelectedCollection,
                          }: {
    collections: Collection[]
    setCollections: (collections: Collection[]) => void
    selectedCollection: Collection | null
    setSelectedCollection: (collection: Collection | null) => void
}) {
    return (
        <Select
            onValueChange={(value) => {
                const collection = collections.find((c) => c.name === value)
                setSelectedCollection(collection ?? null)
                console.log('Selected collection: ', collection)
            }}
            value={selectedCollection?.name ?? ''}
        >
            <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select a collection' />
            </SelectTrigger>
            <SelectContent>
                {collections.map((collection) => (
                    <SelectItem value={collection.name} key={collection.id}>
                        {collection.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}


import clsx from 'clsx'

function MiniCard({ data, className }: { data?: any, className?: string }) {
    return (
        <Card className={clsx(className, 'm-0 p-0')}>
            <CardContent className='flex flex-col items-center gap-2 p-0'>
                <img
                    src={data?.default_photo?.medium_url}
                    alt={data?.name}
                    className='h-full object-cover aspect-square'
                />
                <div>{data?.id}</div>
                <div>{data?.name}</div>
            </CardContent>
        </Card>
    );
}

