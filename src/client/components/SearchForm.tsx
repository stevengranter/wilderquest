import { useParams, useNavigate, Link } from 'react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import SearchAutoComplete from '@/components/SearchAutoComplete'
import SearchResults from '@/components/SearchResults'
import ImageInput from '@/components/ImageInput'
import { useQuery } from '@tanstack/react-query'

import { useQueryClient } from '@tanstack/react-query'
import {
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import React from 'react'

function useTaxonSearch(taxonId: string) {
    return useQuery({
        queryKey: ['taxon', taxonId],
        queryFn: () =>
            axios
                .get(`/api/iNatAPI/taxa/?taxon_id=${taxonId}`)
                .then((res) => res.data.results),
        enabled: !!taxonId,
        initialData: [] as iNatTaxaResponse[],
    })
}

export default function SearchForm() {
    const queryClient = useQueryClient()
    const { taxonId } = useParams()
    const navigate = useNavigate()
    const [selectedItemName, setSelectedItemName] = useState('')
    const [searchResults, setSearchResults] = useState<iNatTaxaResponse[]>([])
    const [searchHistory, setSearchHistory] = useState<iNatTaxaResponse[]>([])

    const { data, isLoading } = useTaxonSearch(taxonId)

    useEffect(() => {
        console.log(data)
    }, [data])

    // useEffect(() => {
    //     if (!taxonId) return
    //     axios.get(`/api/iNatAPI/taxa/?taxon_id=${taxonId}`).then((res) => {
    //         const item = res.data.results[0]
    //         setSelectedItemName(item.preferred_common_name || item.name)
    //         setSearchResults(res.data.results)
    //     })
    // }, [taxonId])

    async function handleSelect(item: iNatTaxaResponse) {
        await queryClient.prefetchQuery({
            queryKey: ['taxon', item.id],
            queryFn: () =>
                axios
                    .get(`/api/iNatAPI/taxa/?taxon_id=${item.id}`)
                    .then((res) => res.data.results),
        })

        navigate(`/search/${item.id}`)
        setSearchHistory([...searchHistory, item])
        console.log(searchHistory)
    }

    return (
        <>
            <SearchAutoComplete
                selectionHandler={handleSelect}
                selectedItemName={selectedItemName}
            />
            <SearchHistory searchHistory={searchHistory} />
            <SearchResults searchResults={data} onSelect={handleSelect} />
            <ImageInput />
        </>
    )
}

function SearchHistory({
    searchHistory,
}: {
    searchHistory: iNatTaxaResponse[]
}) {
    return (
        searchHistory &&
        searchHistory.length > 0 && (
            <BreadcrumbList>
                {searchHistory.map((item, index) => (
                    <React.Fragment key={`${item.id}-${item.name}-${index}`}>
                        <BreadcrumbItem>
                            <Link to={`/search/${item.id}`}>{item.name}</Link>
                        </BreadcrumbItem>
                        {index < searchHistory.length - 1 && (
                            <BreadcrumbSeparator />
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        )
    )
}
