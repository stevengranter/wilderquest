import {
    INatObservationsResponse,
    INatTaxaResponse,
} from '@shared/types/iNaturalist'

export enum ViewMode {
    Grid = 'grid',
    List = 'list',
    Map = 'map',
}

export type SearchResults = INatTaxaResponse | INatObservationsResponse

interface SearchContextState {
    viewMode: ViewMode
    results: SearchResults | undefined
}

interface SearchContextActions {
    setViewMode: (mode: ViewMode) => void
    setResults: (results: SearchResults) => void
}

export type SearchContextType = SearchContextState & SearchContextActions
