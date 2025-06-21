import { useState } from 'react'

export const useSelectionState = () => {
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])
    const [isSelectionMode, setIsSelectionMode] = useState(false)

    const addIdToSelection = (id: number | string) => {
        setSelectedIds(prev => [...prev, id])
    }

    const removeIdFromSelection = (id: number | string) => {
        setSelectedIds(prev => prev.filter(item => item !== id))
    }

    return { isSelectionMode, setIsSelectionMode, selectedIds, setSelectedIds, addIdToSelection, removeIdFromSelection }
}

export type SelectionStae = ReturnType<typeof useSelectionState>