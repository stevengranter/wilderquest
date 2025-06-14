// Type Guard for INatTaxon
import { INatObservation, INatTaxon } from '../../../shared/types/iNatTypes'

function isINatTaxon(result: INatTaxon | INatObservation): result is INatTaxon {
    return (result as INatTaxon).name !== undefined && (result as INatTaxon).rank !== undefined
}

// Type Guard for INatObservation
function isINatObservation(result: INatTaxon | INatObservation): result is INatObservation {
    return (result as INatObservation).species_guess !== undefined && (result as INatObservation).observed_on !== undefined
}

export function simplifyResultsForLLM(results: INatTaxon[] | INatObservation[], category: string) {
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
