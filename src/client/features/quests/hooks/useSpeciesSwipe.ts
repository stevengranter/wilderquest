import { useCallback, useState } from 'react'

interface TaxonData {
    default_photo: {
        id: number
        license_code: string
        attribution: string
        url: string
        original_dimensions: {
            height: number
            width: number
        }
        flags: any[]
        attribution_name: string | null
        square_url: string
        medium_url: string
    }
    id: number
    name: string
    preferred_common_name: string
    rank?: string
    observations_count?: number
}

interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface SwipeAction {
    type: 'add' | 'reject'
    species: SpeciesCountItem
    timestamp: number
}

interface UseSpeciesSwipeProps {
    availableSpecies: SpeciesCountItem[]
    questSpecies: Map<number, SpeciesCountItem>
    setQuestSpecies: (
        fn: (
            prev: Map<number, SpeciesCountItem>
        ) => Map<number, SpeciesCountItem>
    ) => void
    onSpeciesAdded?: (species: SpeciesCountItem) => void
    onSpeciesRejected?: (species: SpeciesCountItem) => void
}

export function useSpeciesSwipe({
    availableSpecies,
    questSpecies,
    setQuestSpecies,
    onSpeciesAdded,
    onSpeciesRejected,
}: UseSpeciesSwipeProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [swipedSpecies, setSwipedSpecies] = useState<Set<number>>(new Set())
    const [actionHistory, setActionHistory] = useState<SwipeAction[]>([])

    // Filter out species that have already been swiped or are already in the quest
    const filteredSpecies = availableSpecies.filter(
        (species) =>
            !swipedSpecies.has(species.taxon.id) &&
            !questSpecies.has(species.taxon.id)
    )

    const currentSpecies = filteredSpecies[currentIndex]
    const lastAction = actionHistory[actionHistory.length - 1] || null
    const hasMoreSpecies = currentIndex < filteredSpecies.length
    const totalSpeciesCount = availableSpecies.length
    const progress =
        totalSpeciesCount > 0 ? (currentIndex / totalSpeciesCount) * 100 : 0

    const handleSwipeComplete = useCallback(
        (direction: 'left' | 'right', species: SpeciesCountItem) => {
            const action: SwipeAction = {
                type: direction === 'right' ? 'add' : 'reject',
                species,
                timestamp: Date.now(),
            }

            // Add to swiped species
            setSwipedSpecies((prev) => new Set([...prev, species.taxon.id]))

            // Add to action history
            setActionHistory((prev) => [...prev, action])

            if (direction === 'right') {
                // Swipe right = Add to quest
                setQuestSpecies((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(species.taxon.id, species)
                    return newMap
                })
                onSpeciesAdded?.(species)
            } else {
                // Swipe left = Reject
                onSpeciesRejected?.(species)
            }

            // Move to next species
            setCurrentIndex((prev) => prev + 1)
        },
        [setQuestSpecies, onSpeciesAdded, onSpeciesRejected]
    )

    const handleUndoLastAction = useCallback(() => {
        if (!lastAction) return

        const { type, species } = lastAction

        // Remove from swiped set
        setSwipedSpecies((prev) => {
            const newSet = new Set(prev)
            newSet.delete(species.taxon.id)
            return newSet
        })

        // If it was added to quest, remove it
        if (type === 'add') {
            setQuestSpecies((prev) => {
                const newMap = new Map(prev)
                newMap.delete(species.taxon.id)
                return newMap
            })
        }

        // Remove from action history
        setActionHistory((prev) => prev.slice(0, -1))

        // Go back one step
        setCurrentIndex((prev) => Math.max(0, prev - 1))
    }, [lastAction, setQuestSpecies])

    const handleButtonAction = useCallback(
        (action: 'reject' | 'add') => {
            if (!currentSpecies) return
            handleSwipeComplete(
                action === 'add' ? 'right' : 'left',
                currentSpecies
            )
        },
        [currentSpecies, handleSwipeComplete]
    )

    const resetSwipeSession = useCallback(() => {
        setSwipedSpecies(new Set())
        setCurrentIndex(0)
        setActionHistory([])
    }, [])

    const skipToNextSpecies = useCallback(() => {
        if (currentSpecies) {
            handleSwipeComplete('left', currentSpecies)
        }
    }, [currentSpecies, handleSwipeComplete])

    const addCurrentSpecies = useCallback(() => {
        if (currentSpecies) {
            handleSwipeComplete('right', currentSpecies)
        }
    }, [currentSpecies, handleSwipeComplete])

    const getSwipeStats = useCallback(() => {
        const totalSwiped = actionHistory.length
        const totalAdded = actionHistory.filter(
            (action) => action.type === 'add'
        ).length
        const totalRejected = actionHistory.filter(
            (action) => action.type === 'reject'
        ).length
        const totalRemaining = filteredSpecies.length - currentIndex
        const totalAlreadySelected = questSpecies.size

        return {
            totalSwiped,
            totalAdded,
            totalRejected,
            totalRemaining,
            totalAvailable: filteredSpecies.length,
            totalAlreadySelected,
            progress,
        }
    }, [actionHistory, filteredSpecies.length, currentIndex, progress])

    return {
        // Current state
        currentSpecies,
        currentIndex,
        lastAction,
        hasMoreSpecies,
        filteredSpecies,

        // Actions
        handleSwipeComplete,
        handleUndoLastAction,
        handleButtonAction,
        resetSwipeSession,
        skipToNextSpecies,
        addCurrentSpecies,

        // Stats and utilities
        getSwipeStats,
        progress,
        actionHistory,

        // Edit mode specific
        canUndo: actionHistory.length > 0,
        totalAvailable: filteredSpecies.length,
    }
}
