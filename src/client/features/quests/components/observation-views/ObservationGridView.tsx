import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PhotoModal } from '../PhotoModal'
import { ObservationCard, type Observation } from '../ObservationCard'

interface ObservationGridViewProps {
    observations: Observation[]
    showRadiusBadges?: boolean
}

export function ObservationGridView({
    observations,
    showRadiusBadges = true,
}: ObservationGridViewProps) {
    const [photoModalOpen, setPhotoModalOpen] = useState(false)
    const [selectedObservationIndex, setSelectedObservationIndex] = useState(0)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

    const observationsWithPhotos = observations.filter(
        (obs) => obs.photos.length > 0
    )

    const handlePhotoClick = (observationIndex: number, photoIndex: number) => {
        setSelectedObservationIndex(observationIndex)
        setSelectedPhotoIndex(photoIndex)
        setPhotoModalOpen(true)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <AnimatePresence>
                {observationsWithPhotos.map((obs, index) => {
                    return (
                        <motion.div
                            key={obs.id}
                            initial={{
                                opacity: 0,
                                y: 30,
                                scale: 0.8,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -20,
                                scale: 0.8,
                            }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.15,
                                ease: 'easeOut',
                                type: 'spring',
                                damping: 15,
                                stiffness: 100,
                            }}
                            whileTap={{
                                scale: 0.95,
                            }}
                            style={{
                                transformOrigin: 'center center',
                            }}
                        >
                            <ObservationCard
                                observation={obs}
                                showRadiusBadges={showRadiusBadges}
                                onPhotoClick={handlePhotoClick}
                                observationIndex={index}
                                variant="grid"
                            />
                        </motion.div>
                    )
                })}
            </AnimatePresence>

            {/* Photo Modal */}
            <PhotoModal
                isOpen={photoModalOpen}
                onClose={() => setPhotoModalOpen(false)}
                observations={observationsWithPhotos}
                initialObservationIndex={selectedObservationIndex}
                initialPhotoIndex={selectedPhotoIndex}
            />
        </div>
    )
}
