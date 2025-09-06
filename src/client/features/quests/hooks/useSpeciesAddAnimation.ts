import { useCallback, useRef, useState } from 'react'

import type { TaxonData } from '@shared/types'

interface SpeciesCountItem {
    taxon: {
        id: number
        name: string
        preferred_common_name: string
        default_photo?: {
            id: number
            license_code: string | null
            attribution: string
            url: string
            original_dimensions: { height: number; width: number }
            flags: unknown[]
            attribution_name: string | null
            square_url: string
            medium_url: string
        }
    }
    count: number
}

interface AnimationInstance {
    id: string
    species: SpeciesCountItem | TaxonData
    fromPosition: { x: number; y: number }
    toPosition: { x: number; y: number }
}

export function useSpeciesAddAnimation() {
    const [activeAnimations, setActiveAnimations] = useState<
        AnimationInstance[]
    >([])
    const animationCounter = useRef(0)

    const triggerAddAnimation = useCallback(
        (
            species: SpeciesCountItem | TaxonData,
            fromElement: HTMLElement,
            toElement: HTMLElement
        ) => {
            // Get positions relative to viewport
            const fromRect = fromElement.getBoundingClientRect()
            const toRect = toElement.getBoundingClientRect()

            const fromPosition = {
                x: fromRect.left + fromRect.width / 2,
                y: fromRect.top + fromRect.height / 2,
            }

            const toPosition = {
                x: toRect.left + toRect.width / 2,
                y: toRect.top + toRect.height / 2,
            }

            const animationId = `animation-${animationCounter.current++}`

            const newAnimation: AnimationInstance = {
                id: animationId,
                species,
                fromPosition,
                toPosition,
            }

            setActiveAnimations((prev) => [...prev, newAnimation])

            // Auto-cleanup after animation completes
            setTimeout(() => {
                setActiveAnimations((prev) =>
                    prev.filter((anim) => anim.id !== animationId)
                )
            }, 800) // Match animation duration + buffer

            return animationId
        },
        []
    )

    const cancelAnimation = useCallback((animationId: string) => {
        setActiveAnimations((prev) =>
            prev.filter((anim) => anim.id !== animationId)
        )
    }, [])

    const cancelAllAnimations = useCallback(() => {
        setActiveAnimations([])
    }, [])

    // Hook for components to get animation trigger positions
    const getElementPosition = useCallback((element: HTMLElement | null) => {
        if (!element) return { x: 0, y: 0 }

        const rect = element.getBoundingClientRect()
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        }
    }, [])

    // Enhanced trigger that automatically finds common source/target elements
    const triggerAddAnimationFromCard = useCallback(
        (
            species: SpeciesCountItem | TaxonData,
            sourceCardElement?: HTMLElement
        ) => {
            // Find the source element (swipe card or list item)
            const sourceElement =
                sourceCardElement ||
                (document.querySelector('[data-species-card]') as HTMLElement)

            // Find the target element (current species list)
            const targetElement = document.querySelector(
                '[data-current-species-list]'
            ) as HTMLElement

            if (sourceElement && targetElement) {
                return triggerAddAnimation(
                    species,
                    sourceElement,
                    targetElement
                )
            }

            return null
        },
        [triggerAddAnimation]
    )

    // Trigger animation with custom positions
    const triggerAddAnimationWithPositions = useCallback(
        (
            species: SpeciesCountItem | TaxonData,
            fromPosition: { x: number; y: number },
            toPosition: { x: number; y: number }
        ) => {
            const animationId = `animation-${animationCounter.current++}`

            const newAnimation: AnimationInstance = {
                id: animationId,
                species,
                fromPosition,
                toPosition,
            }

            setActiveAnimations((prev) => [...prev, newAnimation])

            setTimeout(() => {
                setActiveAnimations((prev) =>
                    prev.filter((anim) => anim.id !== animationId)
                )
            }, 800)

            return animationId
        },
        []
    )

    return {
        activeAnimations,
        triggerAddAnimation,
        triggerAddAnimationFromCard,
        triggerAddAnimationWithPositions,
        cancelAnimation,
        cancelAllAnimations,
        getElementPosition,
        hasActiveAnimations: activeAnimations.length > 0,
    }
}

// Helper hook for components that want to trigger animations on species add
export function useSpeciesAddTrigger(
    onSpeciesAdded?: (species: SpeciesCountItem | TaxonData) => void
) {
    const { triggerAddAnimationFromCard } = useSpeciesAddAnimation()
    const cardRef = useRef<HTMLElement>(null)

    const handleAddSpecies = useCallback(
        (species: SpeciesCountItem | TaxonData) => {
            // Trigger animation
            if (cardRef.current) {
                triggerAddAnimationFromCard(species, cardRef.current)
            }

            // Call original handler after a small delay to let animation start
            setTimeout(() => {
                onSpeciesAdded?.(species)
            }, 100)
        },
        [onSpeciesAdded, triggerAddAnimationFromCard]
    )

    return {
        cardRef,
        handleAddSpecies,
    }
}

// Utility function to calculate optimal animation curve based on distance
export function getAnimationConfig(
    fromPosition: { x: number; y: number },
    toPosition: { x: number; y: number }
) {
    const distance = Math.sqrt(
        Math.pow(toPosition.x - fromPosition.x, 2) +
            Math.pow(toPosition.y - fromPosition.y, 2)
    )

    // Adjust duration based on distance (min 0.4s, max 1.2s)
    const duration = Math.min(1.2, Math.max(0.4, distance / 500))

    // Use different easing based on direction
    const isUpward = toPosition.y < fromPosition.y
    const ease = isUpward ? [0.25, 0.46, 0.45, 0.94] : [0.25, 0.1, 0.25, 1]

    return {
        duration,
        ease,
        // Add slight curve to the animation path
        pathOffset: distance > 200 ? 50 : 20,
    }
}
