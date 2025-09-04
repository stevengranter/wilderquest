import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Observation } from './ObservationCard'
import { ProgressiveObservationImage } from './ProgressiveObservationImage'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MdOutlineLocationOn } from 'react-icons/md'

interface PhotoModalProps {
    isOpen: boolean
    onClose: () => void
    observations: Observation[]
    initialPhotoIndex: number
    initialObservationIndex: number
}

export function PhotoModal({
    isOpen,
    onClose,
    observations,
    initialPhotoIndex,
    initialObservationIndex,
}: PhotoModalProps) {
    const [currentObservationIndex, setCurrentObservationIndex] = useState(
        initialObservationIndex
    )
    const [currentPhotoIndex, setCurrentPhotoIndex] =
        useState(initialPhotoIndex)

    // Reset indices when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setCurrentObservationIndex(initialObservationIndex)
            setCurrentPhotoIndex(initialPhotoIndex)
        }
    }, [isOpen, initialObservationIndex, initialPhotoIndex])

    // Get current observation and photo
    const currentObservation = observations[currentObservationIndex]
    const currentPhoto = currentObservation?.photos[currentPhotoIndex]

    // Calculate total photos across all observations
    const totalPhotos = observations.reduce(
        (total, obs) => total + obs.photos.length,
        0
    )

    // Calculate current photo number (1-based)
    const getCurrentPhotoNumber = () => {
        let photoCount = 0
        for (let i = 0; i < currentObservationIndex; i++) {
            photoCount += observations[i].photos.length
        }
        return photoCount + currentPhotoIndex + 1
    }

    const goToNext = () => {
        if (!currentObservation) return

        // Try to go to next photo in current observation
        if (currentPhotoIndex < currentObservation.photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1)
        } else {
            // Go to next observation's first photo
            if (currentObservationIndex < observations.length - 1) {
                setCurrentObservationIndex(currentObservationIndex + 1)
                setCurrentPhotoIndex(0)
            }
        }
    }

    const goToPrevious = () => {
        if (!currentObservation) return

        // Try to go to previous photo in current observation
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1)
        } else {
            // Go to previous observation's last photo
            if (currentObservationIndex > 0) {
                const prevObservation =
                    observations[currentObservationIndex - 1]
                setCurrentObservationIndex(currentObservationIndex - 1)
                setCurrentPhotoIndex(prevObservation.photos.length - 1)
            }
        }
    }

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault()
                    goToPrevious()
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    goToNext()
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isOpen, currentObservationIndex, currentPhotoIndex, observations])

    // Touch/swipe support for mobile
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe) {
            goToNext()
        } else if (isRightSwipe) {
            goToPrevious()
        }
    }

    if (!currentObservation || !currentPhoto) {
        return null
    }

    const hasPrevious = currentObservationIndex > 0 || currentPhotoIndex > 0
    const hasNext =
        currentObservationIndex < observations.length - 1 ||
        currentPhotoIndex < currentObservation.photos.length - 1

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-4xl w-full h-[90vh] p-0 bg-transparent border-none shadow-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 rounded-full bg-black/50 p-2 sm:p-3 text-white hover:bg-black/70 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Navigation buttons */}
                {hasPrevious && (
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 p-3 sm:p-4 text-white hover:bg-black/70 transition-colors"
                        aria-label="Previous photo"
                    >
                        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                    </button>
                )}

                {hasNext && (
                    <button
                        onClick={goToNext}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 p-3 sm:p-4 text-white hover:bg-black/70 transition-colors"
                        aria-label="Next photo"
                    >
                        <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                    </button>
                )}

                {/* Main content */}
                <div className="flex flex-col h-full">
                    {/* Photo counter */}
                    <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-40 bg-black/50 px-3 py-1 rounded-full text-white text-xs sm:text-sm font-medium">
                        {getCurrentPhotoNumber()} of {totalPhotos}
                    </div>

                    {/* Photo display area */}
                    <div className="flex-1 flex items-center justify-center p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${currentObservationIndex}-${currentPhotoIndex}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="max-w-md w-full"
                            >
                                {/* Polaroid-style card */}
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-2xl">
                                    {/* Photo */}
                                    <div className="aspect-square mb-4 overflow-hidden rounded-sm">
                                        <ProgressiveObservationImage
                                            photo={currentPhoto}
                                            className="w-full h-full"
                                        />
                                    </div>

                                    {/* Metadata */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm truncate">
                                                {currentObservation.user.login}
                                            </p>
                                            {currentObservation.searchRadius && (
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0 ${
                                                        currentObservation.searchRadius ===
                                                        20
                                                            ? 'bg-blue-500'
                                                            : currentObservation.searchRadius ===
                                                                100
                                                              ? 'bg-green-500'
                                                              : 'bg-purple-500'
                                                    }`}
                                                >
                                                    {
                                                        currentObservation.searchRadius
                                                    }
                                                    km
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {
                                                currentObservation.observed_on_string
                                            }
                                        </p>
                                        {currentObservation.place_guess && (
                                            <div className="flex items-center gap-1">
                                                <MdOutlineLocationOn className="text-gray-500 flex-shrink-0" />
                                                <p className="text-gray-600 text-xs truncate">
                                                    {
                                                        currentObservation.place_guess
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Bottom info bar */}
                    <div className="bg-black/70 text-white p-3 sm:p-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-xs sm:text-sm text-center opacity-75">
                                <span className="hidden sm:inline">
                                    Use arrow keys or swipe to navigate • Press
                                    Escape to close
                                </span>
                                <span className="sm:hidden">
                                    Swipe to navigate • Tap X to close
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
