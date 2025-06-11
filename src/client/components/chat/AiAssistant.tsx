import { useSearchParams } from 'react-router'
import { useEffect, useState, useMemo } from 'react' // Import useMemo
import { useSearchContext } from '@/contexts/search/SearchContext'
import { INatObservation, INatTaxon } from '../../../shared/types/iNatTypes'

export default function AiAssistant() {
    const [searchParams] = useSearchParams()
    const searchCategory = searchParams.get('category')
    const { selectedIds, response } = useSearchContext()
    const [simplifiedResults, setSimplifiedResults] = useState<any[]>([])

    const selectedResults = useMemo(() => {
        return simplifiedResults.filter((result) => selectedIds.includes(Number(result.id)))
    }, [simplifiedResults, selectedIds])

    useEffect(() => {
        console.log({ selectedIds })
    }, [selectedIds])

    useEffect(() => {
        console.log(searchCategory)
    }, [searchParams])

    useEffect(() => {
        console.table(simplifiedResults)
    }, [simplifiedResults])

    useEffect(() => {
        console.log('selectedResults: ')
        console.log(selectedResults)
    }, [selectedResults])

    useEffect(() => {
        if (!response?.results) return
        setSimplifiedResults(simplifyResultsForLLM(response.results, searchCategory as 'species' | 'observations'))
    }, [response, searchCategory]) // Added searchCategory to dependencies as simplifyResultsForLLM depends on it

    return <div>AI Assistant</div>
}

// Type Guard for INatTaxon
function isINatTaxon(result: INatTaxon | INatObservation): result is INatTaxon {
    return (result as INatTaxon).name !== undefined && (result as INatTaxon).rank !== undefined
}

// Type Guard for INatObservation
function isINatObservation(result: INatTaxon | INatObservation): result is INatObservation {
    return (result as INatObservation).species_guess !== undefined && (result as INatObservation).observed_on !== undefined
}

function simplifyResultsForLLM(results: INatTaxon[] | INatObservation[], category: string) {
    return results.map((result) => {
        return simplifyResult(result, category as 'species' | 'observations')
    })
}

function simplifyResult(
    result: INatTaxon | INatObservation,
    searchType: 'species' | 'observations',
) {
    if (!result) return null

    // Common fields
    const simplified = {
        id: result.id,
    }

    switch (searchType) {
        case 'species':
            if (isINatTaxon(result)) {
                return {
                    ...simplified,
                    name: result.name,
                    ancestry: result.ancestry,
                    preferred_common_name: result.preferred_common_name,
                    rank: result.rank,
                    wikipedia_url: result.wikipedia_url,
                }
            }
            break
        case 'observations':
            if (isINatObservation(result)) {
                return {
                    ...simplified,
                    species_guess: result.species_guess,
                    observed_on: result.observed_on,
                    place_guess: result.place_guess,
                }
            }
            break
        default:
            break
    }
    return simplified
}
