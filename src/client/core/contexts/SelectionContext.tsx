import { createContext, useContext, useState } from 'react'
import { SelectionStae } from '@/hooks/useSelectionState'

const SelectionContext = createContext<SelectionStae | null>(null)

const SelectionProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])
    const [isSelectionMode, setIsSelectionMode] = useState(false)

    const addIdToSelection = (id: number | string) => {
        setSelectedIds((prev) => [...prev, id])
    }

    const removeIdFromSelection = (id: number | string) => {
        setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
    return (
        <SelectionContext.Provider
            value={{
                isSelectionMode,
                setIsSelectionMode,
                selectedIds,
                setSelectedIds,
                addIdToSelection,
                removeIdFromSelection,
            }}
        >
            {children}
        </SelectionContext.Provider>
    )
}

const useSelectionContext = () => {
    const context = useContext(SelectionContext)
    if (!context) {
        throw new Error(
            'useSelectionContext must be used within a SelectionProvider'
        )
    }
    return context
}

export { SelectionProvider, useSelectionContext }
