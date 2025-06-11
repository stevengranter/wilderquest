import { INatObservationsResponse, INatTaxaResponse } from '../../../shared/types/iNatTypes'

export enum ViewMode {
    Grid = 'grid',
    List = 'list',
    Map = 'map'
}

export type SearchResults = INatTaxaResponse | INatObservationsResponse;

interface SearchContextState {
    selectedIds: (number | string)[];
    viewMode: ViewMode;
    results: SearchResults | undefined;
}

interface SearchContextActions {
    setSelectedIds: (ids: (number | string)[]) => void;
    addIdToSelection: (id: number | string) => void;
    removeIdFromSelection: (id: number | string) => void;
    setViewMode: (mode: ViewMode) => void;
    setResults: (results: SearchResults) => void;
}

export type SearchContextType = SearchContextState & SearchContextActions;

