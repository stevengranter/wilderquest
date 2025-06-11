import { INatObservationsResponse, INatTaxaResponse } from '../../../shared/types/iNatTypes'

export enum ViewMode {
    Grid = 'grid',
    List = 'list',
    Map = 'map'
}

export type INatResponse = INatTaxaResponse | INatObservationsResponse;

interface SearchContextState {
    selectedIds: number[];
    viewMode: ViewMode;
    response: INatResponse | undefined;
}

interface SearchContextActions {
    setSelectedIds: (ids: number[]) => void;
    addIdToSelection: (id: number) => void;
    removeIdFromSelection: (id: number) => void;
    setViewMode: (mode: ViewMode) => void;
    setResponse: (results: INatResponse) => void;
}

export type SearchContextType = SearchContextState & SearchContextActions;

