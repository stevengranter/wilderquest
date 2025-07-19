import { createContext, ReactNode, useContext, useState } from 'react'
import {
    SearchContextType,
    SearchResults,
    ViewMode,
} from '@/contexts/search/SearchContext.types'

const SearchContext = createContext<SearchContextType | undefined>(undefined)

interface SearchProviderProps {
    children: ReactNode
}

const SearchProvider = ({ children }: SearchProviderProps) => {
    // const selectionState = useSelectionState()
    const [results, setResults] = useState<SearchResults | undefined>(undefined)
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.List)

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
