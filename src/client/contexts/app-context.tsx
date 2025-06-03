'use client'

import { createContext, useContext, useState, type ReactNode, useMemo } from 'react'

type UserLocation = {
    lat?: number
    lng?: number
    displayName?: string
}

// Define the types for our cards data
export type Card = {
    id: string
    title: string
    description: string
    category: string
    createdAt: string
}

// Define the context type
type AppContextType = {
    location: UserLocation | null
    setLocation: (location: (prev) => any) => void
    cards: Card[]
    setCards: (cards: Card[]) => void
    selectedCard: Card | null
    setSelectedCard: (card: Card | null) => void
    isLoading: boolean
    setIsLoading: (isLoading: boolean) => void
    filters: {
        category: string | null
        searchTerm: string | null
    }
    setFilters: (filters: { category: string | null; searchTerm: string | null }) => void
    filteredCards: Card[]
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
    location: null,
    setLocation: () => {
    },
    cards: [],
    setCards: () => {
    },
    selectedCard: null,
    setSelectedCard: () => {
    },
    isLoading: false,
    setIsLoading: () => {
    },
    filters: {
        category: null,
        searchTerm: null,
    },
    setFilters: () => {
    },
    filteredCards: [],
})

// Create a provider component
export function AppProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<UserLocation | null>(null)
    const [cards, setCards] = useState<Card[]>([])
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [filters, setFilters] = useState({
        category: null,
        searchTerm: null,
    })

    // Compute filteredCards here
    const filteredCards = useMemo(() => {
        return cards.filter((card) => {
            const matchesSearch =
                !filters.searchTerm ||
                card.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                card.description.toLowerCase().includes(filters.searchTerm.toLowerCase())

            const matchesCategory = !filters.category || card.category === filters.category

            return matchesSearch && matchesCategory
        })
    }, [cards, filters])

    return (
        <AppContext.Provider
            value={{
                location,
                setLocation,
                cards,
                setCards,
                selectedCard,
                setSelectedCard,
                isLoading,
                setIsLoading,
                filters,
                setFilters,
                filteredCards,
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

// Create a custom hook to use the context
export function useAppContext() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}
