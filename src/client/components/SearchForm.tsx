import { useParams, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import SearchAutoComplete from '@/components/SearchAutoComplete'
import SearchResults from '@/components/SearchResults'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import _ from 'lodash'
import React from 'react'
import SearchHistory from '@/components/SearchHistory'

// Hook to fetch data for a specific taxon ID
function useTaxonSearch(taxonId: string | undefined) {
    return useQuery<iNatTaxaResponse[], Error>({
        queryKey: ['taxon', taxonId],
        queryFn: () =>
            axios
                .get(`/api/iNatAPI/taxa/?taxon_id=${taxonId}`)
                .then((res) => res.data.results),
        enabled: !!taxonId,
        initialData: [],
    })
}

// Hook to fetch data based on a text query
function useTextSearch(query: string) {
    return useQuery<iNatTaxaResponse[], Error>({
        queryKey: ['textSearch', query],
        queryFn: () =>
            axios
                .get(`/api/iNatAPI/taxa/?q=${query}&per_page=10`)
                .then((res) => res.data.results),
        enabled: !!query,
        initialData: [],
    })
}

export default function SearchForm() {
    const queryClient = useQueryClient()
    const { taxonId } = useParams<{ taxonId?: string }>()
    const navigate = useNavigate()
    const [searchText, setSearchText] = useState('')
    const [selectedItemName, setSelectedItemName] = useState('')
    const [searchHistory, setSearchHistory] = useState<iNatTaxaResponse[]>([])

    const { data: taxonData, isLoading: isLoadingTaxon, error } =
        useTaxonSearch(taxonId)
    const { data: searchResultsFromText, isLoading: isLoadingTextSearch } =
        useTextSearch(searchText)

    useEffect(() => {
        if (taxonId) {
            setSearchText('')
        }
    }, [taxonId])

    useEffect(() => {
        console.log('Current Taxon Data:', taxonData)
        console.log('Current Text Search Results:', searchResultsFromText)
    }, [taxonData, searchResultsFromText])

    async function handleSelect(item: iNatTaxaResponse) {
        await queryClient.prefetchQuery({
            queryKey: ['taxon', item.id.toString()],
            queryFn: () =>
                axios
                    .get(`/api/iNatAPI/taxa/?taxon_id=${item.id}`)
                    .then((res) => res.data.results),
        })

        navigate(`/explore/${item.id}`)

        setSearchHistory((prevHistory) => {
            if (
                prevHistory.length > 0 &&
                prevHistory[prevHistory.length - 1].id === item.id
            ) {
                return prevHistory
            }
            const historyWithoutItem = prevHistory.filter(
                (historyItem) => historyItem.id !== item.id
            )
            return [...historyWithoutItem, item]
        })

        setSearchText('')
        setSelectedItemName(
            `${_.startCase(_.camelCase(item.preferred_common_name))} (${item.name})`
        )
    }

    // async function handleSearch(query: string) {
    //     console.log('Handling search for query:', query)
    //     setSearchText(query)
    // }

    const resultsToDisplay = searchText ? searchResultsFromText : taxonData
    const isLoadingResults = searchText ? isLoadingTextSearch : isLoadingTaxon

    return (
        <>
            <SearchAutoComplete
                selectionHandler={handleSelect}
                selectedItemName={selectedItemName}
            />
            <SearchHistory
                searchHistory={searchHistory}
                setSearchHistory={setSearchHistory}
            />
            <SearchResults
                searchResults={resultsToDisplay}
                onSelect={handleSelect}
                isLoading={isLoadingResults}
            />
        </>
    )
}

