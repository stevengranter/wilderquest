import { useState } from 'react'

export type ViewMode = 'grid' | 'list' | 'map'

export const useViewMode = (initialMode: ViewMode = 'grid') => {
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode)

    return {
        viewMode,
        setViewMode,
    }
}
