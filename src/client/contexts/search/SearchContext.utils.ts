import { useState } from 'react'

export const useSelectionState = () => {
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([])

    const addIdToSelection = (id: number | string) => {
        setSelectedIds(prev => [...prev, id])
    }

    const removeIdFromSelection = (id: number | string) => {
        setSelectedIds(prev => prev.filter(item => item !== id))
    }

    return { selectedIds, setSelectedIds, addIdToSelection, removeIdFromSelection }
}
