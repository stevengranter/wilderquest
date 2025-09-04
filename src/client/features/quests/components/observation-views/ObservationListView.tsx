import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { PhotoModal } from '../PhotoModal'
import { ObservationCard, type Observation } from '../ObservationCard'

interface ObservationListViewProps {
    observations: Observation[]
    showRadiusBadges?: boolean
}

export function ObservationListView({
    observations,
    showRadiusBadges = true,
}: ObservationListViewProps) {
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
        <div className="space-y-3">
            <AnimatePresence>
                {observationsWithPhotos.map((obs, index) => (
                    <motion.div
                        key={obs.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                        }}
                        whileHover={{ scale: 1.01 }}
                    >
                        <Card
                            className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => handlePhotoClick(index, 0)}
                        >
                            <ObservationCard
                                observation={obs}
                                showRadiusBadges={showRadiusBadges}
                                variant="list"
                            />
                        </Card>
                    </motion.div>
                ))}
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
