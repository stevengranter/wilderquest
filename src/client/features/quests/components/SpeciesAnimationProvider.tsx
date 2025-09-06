'use client'

import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import type { TaxonData } from '@shared/types'

interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

interface AnimationInstance {
    id: string
    species: SpeciesCountItem | TaxonData
    fromPosition: { x: number; y: number }
    toPosition: { x: number; y: number }
    startTime: number
}

interface SpeciesAnimationContextType {
    triggerAddAnimation: (
        species: SpeciesCountItem | TaxonData,
        fromElement: HTMLElement,
        toElement?: HTMLElement
    ) => string | null
    triggerAddAnimationWithPositions: (
        species: SpeciesCountItem | TaxonData,
        fromPosition: { x: number; y: number },
        toPosition: { x: number; y: number }
    ) => string
    cancelAnimation: (animationId: string) => void
    cancelAllAnimations: () => void
    registerTarget: (key: string, element: HTMLElement) => void
    unregisterTarget: (key: string) => void
    hasActiveAnimations: boolean
}

const SpeciesAnimationContext =
    createContext<SpeciesAnimationContextType | null>(null)

export function useSpeciesAnimation() {
    const context = useContext(SpeciesAnimationContext)
    if (!context) {
        throw new Error(
            'useSpeciesAnimation must be used within a SpeciesAnimationProvider'
        )
    }
    return context
}

interface SpeciesAnimationProviderProps {
    children: React.ReactNode
}

export function SpeciesAnimationProvider({
    children,
}: SpeciesAnimationProviderProps) {
    const [activeAnimations, setActiveAnimations] = useState<
        AnimationInstance[]
    >([])
    const animationCounter = useRef(0)
    const targetElements = useRef<Map<string, HTMLElement>>(new Map())

    const registerTarget = useCallback((key: string, element: HTMLElement) => {
        targetElements.current.set(key, element)
    }, [])

    const unregisterTarget = useCallback((key: string) => {
        targetElements.current.delete(key)
    }, [])

    const getElementCenter = useCallback((element: HTMLElement) => {
        const rect = element.getBoundingClientRect()
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        }
    }, [])

    const triggerAddAnimation = useCallback(
        (
            species: SpeciesCountItem | TaxonData,
            fromElement: HTMLElement,
            toElement?: HTMLElement
        ) => {
            const fromPosition = getElementCenter(fromElement)

            // If no target element provided, try to find the current species list
            const targetElement =
                toElement ||
                targetElements.current.get('current-species-list') ||
                (document.querySelector(
                    '[data-current-species-list]'
                ) as HTMLElement)

            if (!targetElement) {
                console.warn('No target element found for species animation')
                return null
            }

            const toPosition = getElementCenter(targetElement)
            return triggerAddAnimationWithPositions(
                species,
                fromPosition,
                toPosition
            )
        },
        [getElementCenter]
    )

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
                startTime: Date.now(),
            }

            setActiveAnimations((prev) => [...prev, newAnimation])

            // Auto-cleanup after animation completes
            setTimeout(() => {
                setActiveAnimations((prev) =>
                    prev.filter((anim) => anim.id !== animationId)
                )
            }, 1000) // Animation duration + buffer

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

    const contextValue: SpeciesAnimationContextType = {
        triggerAddAnimation,
        triggerAddAnimationWithPositions,
        cancelAnimation,
        cancelAllAnimations,
        registerTarget,
        unregisterTarget,
        hasActiveAnimations: activeAnimations.length > 0,
    }

    return (
        <SpeciesAnimationContext.Provider value={contextValue}>
            {children}
            <SpeciesAnimationOverlay animations={activeAnimations} />
        </SpeciesAnimationContext.Provider>
    )
}

interface SpeciesAnimationOverlayProps {
    animations: AnimationInstance[]
}

function SpeciesAnimationOverlay({ animations }: SpeciesAnimationOverlayProps) {
    if (typeof window === 'undefined') return null

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-50">
            <AnimatePresence>
                {animations.map((animation) => (
                    <AnimatedSpecies key={animation.id} animation={animation} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    )
}

interface AnimatedSpeciesProps {
    animation: AnimationInstance
}

function AnimatedSpecies({ animation }: AnimatedSpeciesProps) {
    const { species, fromPosition, toPosition } = animation
    const taxon = 'taxon' in species ? species.taxon : species

    // Calculate distance for dynamic animation timing
    const distance = Math.sqrt(
        Math.pow(toPosition.x - fromPosition.x, 2) +
            Math.pow(toPosition.y - fromPosition.y, 2)
    )

    const duration = Math.min(0.8, Math.max(0.4, distance / 600))

    return (
        <motion.div
            className="absolute"
            initial={{
                x: fromPosition.x - 24, // Center the 48px (w-12) element
                y: fromPosition.y - 24,
                scale: 1,
                opacity: 1,
                rotate: 0,
            }}
            animate={{
                x: toPosition.x - 24,
                y: toPosition.y - 24,
                scale: [1, 1.1, 0.8],
                opacity: [1, 1, 0.8],
                rotate: [0, 5, -5, 0],
            }}
            exit={{
                scale: 0.6,
                opacity: 0,
                y: toPosition.y - 44, // Move up slightly
            }}
            transition={{
                duration,
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: {
                    times: [0, 0.6, 1],
                    duration,
                },
                opacity: {
                    times: [0, 0.8, 1],
                    duration,
                },
                rotate: {
                    duration: duration * 0.7,
                    ease: 'easeInOut',
                },
            }}
        >
            {/* Species thumbnail */}
            <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 bg-white shadow-lg">
                    {taxon.default_photo?.square_url ? (
                        <img
                            src={taxon.default_photo.square_url}
                            alt={taxon.preferred_common_name || taxon.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-gray-400 text-lg">🐾</div>
                        </div>
                    )}
                </div>

                {/* Success indicator */}
                <motion.div
                    className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: duration * 0.3, duration: 0.2 }}
                >
                    <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{
                            delay: duration * 0.3,
                            duration: 0.4,
                            ease: 'easeInOut',
                        }}
                    >
                        ✓
                    </motion.span>
                </motion.div>

                {/* Trailing particles */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.5, 0.8],
                        opacity: [0.6, 0.3, 0],
                    }}
                    transition={{
                        duration: duration * 0.8,
                        ease: 'easeOut',
                    }}
                />
            </div>

            {/* Species name tooltip */}
            <motion.div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
            >
                {taxon.preferred_common_name || taxon.name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
            </motion.div>
        </motion.div>
    )
}

// Hook for easily triggering animations from components
export function useSpeciesAddTrigger() {
    const { triggerAddAnimation } = useSpeciesAnimation()

    const triggerAnimation = useCallback(
        (species: SpeciesCountItem | TaxonData, sourceElement: HTMLElement) => {
            return triggerAddAnimation(species, sourceElement)
        },
        [triggerAddAnimation]
    )

    return { triggerAnimation }
}

// Hook for registering target elements
export function useAnimationTarget(key: string) {
    const { registerTarget, unregisterTarget } = useSpeciesAnimation()
    const ref = useRef<HTMLElement>(null)

    React.useEffect(() => {
        if (ref.current) {
            registerTarget(key, ref.current)
            return () => unregisterTarget(key)
        }
    }, [key, registerTarget, unregisterTarget])

    return ref
}
