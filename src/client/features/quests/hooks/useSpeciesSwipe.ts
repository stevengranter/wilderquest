import { useCallback, useState } from 'react'

interface TaxonData {
    default_photo?: {
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
    const [reorderedSpecies, setReorderedSpecies] = useState<
        SpeciesCountItem[] | null
    >(null)

    // Filter out species that have already been swiped or are already in the quest
    const baseFilteredSpecies = availableSpecies.filter(
        (species) =>
            !swipedSpecies.has(species.taxon.id) &&
            !questSpecies.has(species.taxon.id)
    )

    // Use reordered species if available, otherwise use base filtered species
    const filteredSpecies = reorderedSpecies || baseFilteredSpecies

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

            // If we have reordered species, remove the swiped species from it
            if (reorderedSpecies) {
                setReorderedSpecies((prev) =>
                    prev
                        ? prev.filter((s) => s.taxon.id !== species.taxon.id)
                        : null
                )
            }

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

        // If we have reordered species, add the species back to the reordered list at the correct position
        if (reorderedSpecies) {
            setReorderedSpecies((prev) => {
                if (!prev) return null
                const newList = [...prev]
                // Insert the species back at the position it was originally
                newList.splice(currentIndex, 0, species)
                return newList
            })
        }

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
        setReorderedSpecies(null)
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

    const jumpToSpecies = useCallback(
        (targetSpecies: SpeciesCountItem) => {
            const targetIndex = filteredSpecies.findIndex(
                (s) => s.taxon.id === targetSpecies.taxon.id
            )

            if (targetIndex >= 0 && targetIndex < filteredSpecies.length) {
                // Reorder the species list to put the target species first
                // This ensures skipped species are still accessible later
                const reordered = [
                    ...filteredSpecies.slice(targetIndex), // Target species and all after it
                    ...filteredSpecies.slice(0, targetIndex), // All species before target (skipped ones)
                ]
                setReorderedSpecies(reordered)
                setCurrentIndex(0) // Target species is now at index 0
            }
        },
        [filteredSpecies]
    )

    const getSwipeStats = useCallback(() => {
        const totalSwiped = actionHistory.length
        const totalAdded = actionHistory.filter(
            (action) => action.type === 'add'
        ).length
        const totalRejected = actionHistory.filter(
            (action) => action.type === 'reject'
        ).length
        const totalRemaining = filteredSpecies.length
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
    }, [actionHistory, filteredSpecies.length, progress])

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
        jumpToSpecies,

        // Stats and utilities
        getSwipeStats,
        progress,
        actionHistory,

        // Edit mode specific
        canUndo: actionHistory.length > 0,
        totalAvailable: filteredSpecies.length,
    }
}
