// @/contexts/search/SearchContext.types.ts

import {
    INatObservationsResponse,
    INatTaxaResponse,
} from '../../../shared/types/iNatTypes' // Ensure this path is correct
import { SearchCategory } from '@/components/search/SearchCategorySelect' // Ensure this path is correct

export enum ViewMode {
    Grid = 'grid',
    List = 'list',
}

// Define the shape of your search results, allowing for null if no data yet
export type SearchResults = {
    observations: INatObservationsResponse | null
    species: INatTaxaResponse | null
    // Add other categories if needed
}

export interface SearchContextType {
    viewMode: ViewMode
    setViewMode: React.Dispatch<React.SetStateAction<ViewMode>> // Use React.Dispatch and React.SetStateAction
    results: SearchResults
    setResults: (
        category: SearchCategory,
        data: INatObservationsResponse | INatTaxaResponse
    ) => void
}
