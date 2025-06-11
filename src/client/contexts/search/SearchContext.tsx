import { createContext, ReactNode, useContext, useState } from 'react'
import { ViewMode, SearchContextType, INatResponse } from '@/contexts/search/SearchContext.types'
import { useSelectionState } from '@/hooks/useSelectionState'


const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
    children: ReactNode;
}

const SearchProvider = ({ children }: SearchProviderProps) => {
    const selectionState = useSelectionState()
    const [response, setResponse] = useState<INatResponse | undefined>(undefined)
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Grid)

    const contextValue: SearchContextType = {
        ...selectionState,
        viewMode,
        response,
        setViewMode,
        setResponse,
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
