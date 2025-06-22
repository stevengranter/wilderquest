import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState,
} from 'react'
import {
    SearchContextType,
    SearchResults,
    ViewMode,
} from '@/contexts/search/SearchContext.types'
import { SearchCategory } from '@/components/search/SearchCategorySelect'
import { INatObservationsResponse } from '../../../shared/types/iNatTypes'

const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
    children: ReactNode
}

const SearchProvider = ({ children }: SearchProviderProps) => {
    // const selectionState = useSelectionState()
    const [results, setResultsState] = useState<SearchResults>({
        observations: null,
        species: null,
    })
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Grid)

    // This function will now update specific category results
    const setResults = useCallback(
        (
            category: SearchCategory,
            data: INatObservationsResponse | INatTaxaResponse
        ) => {
            setResultsState((prevResults) => ({
                ...prevResults,
                [category]: data,
            }))
        },
        []
    )

    const contextValue = {
        // ...selectionState,
        viewMode,
        results,
        setViewMode,
        setResults,
    }

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    )
}

const useSearchContext = () => {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error('useSearchContext must be used within a SearchProvider')
    }
    return context
}

export { SearchProvider, useSearchContext }
