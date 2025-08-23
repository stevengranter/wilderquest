import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import { cn } from '@/lib/utils'

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

export interface Observation {
    id: number
    photos: ObservationPhoto[]
    observed_on_string: string
    place_guess: string
    location?: [number, number] // lat, lng coordinates
    geojson?: {
        coordinates: [number, number] // lng, lat (GeoJSON format)
    }
    user: {
        login: string
    }
}

function ProgressiveObservationImage({
    photo,
    className,
}: {
    photo: ObservationPhoto
    className?: string
}) {
    const { src, isBlurred } = useProgressiveImage(
        photo.url,
        photo.url.replace('square', 'medium')
    )

    return (
        <div className={cn('overflow-hidden', className)}>
            <img
                src={src}
                alt="Observation"
                className={cn(
                    'w-full h-full object-cover',
                    isBlurred && 'filter blur-sm scale-110 transition-all duration-500'
                )}
            />
        </div>
    )
}

export function ObservationGridView({
    observations,
}: {
    observations: Observation[]
}) {
    const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)

    const observationsWithPhotos = observations.filter(
        (obs) => obs.photos.length > 0
    )
    // const rotations = observationsWithPhotos.map(
    //     () => (Math.random() - 0.5) * 16
    // )

    const handleNext = () => {
        if (zoomedIndex === null) return
        setZoomedIndex((zoomedIndex + 1) % observationsWithPhotos.length)
    }

    const handlePrev = () => {
        if (zoomedIndex === null) return
        setZoomedIndex(
            (zoomedIndex - 1 + observationsWithPhotos.length) %
                observationsWithPhotos.length
        )
    }

    return (
        <Dialog
            open={zoomedIndex !== null}
            onOpenChange={(isOpen) => !isOpen && setZoomedIndex(null)}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                <AnimatePresence>
                    {observationsWithPhotos.map((obs, index) => {
                        // const _rotation = rotations[index]
                        return (
                            <DialogTrigger
                                key={obs.id}
                                asChild
                                onClick={() => setZoomedIndex(index)}
                            >
                                <motion.div
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
                                    // whileHover={{
                                    //     scale: 1.05,
                                    //     y: -8,
                                    //     transition: {
                                    //         duration: 0.3,
                                    //         type: 'spring',
                                    //         damping: 10,
                                    //         stiffness: 200,
                                    //     },
                                    // }}
                                    whileTap={{
                                        scale: 0.95,
                                    }}
                                    className="cursor-pointer"
                                    style={{
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    {/* Polaroid Card */}
                                    <div className="bg-white p-3 rounded-lg border-1 hover:shadow-shadow hover:-translate-y-2 transition:shadow duration-300">
                                        {/* Photo Area */}
                                        <ProgressiveObservationImage
                                            photo={obs.photos[0]}
                                            className="aspect-square bg-gray-100 rounded-sm mb-3"
                                        />

                                        {/* Polaroid Caption Area */}
                                        {/*<motion.div*/}
                                        {/*    className="text-xs text-gray-700 space-y-1"*/}
                                        {/*    initial={{ y: 10, opacity: 0 }}*/}
                                        {/*    animate={{ y: 0, opacity: 1 }}*/}
                                        {/*    transition={{*/}
                                        {/*        duration: 0.5,*/}
                                        {/*        delay: index * 0.15 + 0.4,*/}
                                        {/*    }}*/}
                                        {/*>*/}
                                            <p className="font-medium truncate line-clamp-1">
                                                {obs.user.login}
                                            </p>
                                            <p className="text-gray-500 line-clamp-1">
                                                {obs.observed_on_string}
                                            </p>
                                            {obs.place_guess && (
                                                <p className="text-gray-500 truncate text-[10px] line-clamp-1">
                                                    📍 {obs.place_guess}
                                                </p>
                                            )}
                                        {/*</motion.div>*/}
                                    </div>
                                </motion.div>
                            </DialogTrigger>
                        )
                    })}
                </AnimatePresence>
            </div>
            <DialogContent className="p-0 border-0 w-full max-w-sm md:max-w-md lg:max-w-lg bg-transparent shadow-none flex items-center justify-center">
                <AnimatePresence>
                    {observationsWithPhotos.map((obs, index) => {
                        if (zoomedIndex === null) {
                            return null
                        }

                        if (index < zoomedIndex) {
                            return null
                        }
                        if (index > zoomedIndex + 2) {
                            return null
                        }
                        return (
                            <motion.div
                                key={obs.id}
                                className="absolute bg-white p-4 rounded-lg border-1 shadow-xl w-full"
                                style={{
                                    transformOrigin: 'center center',
                                }}
                                initial={{
                                    scale: 1,
                                    y: 0,
                                }}
                                animate={{
                                    scale: 1 - (index - zoomedIndex) * 0.1,
                                    y: (index - zoomedIndex) * 20,
                                    rotate: (index - zoomedIndex) * 5,
                                    zIndex:
                                        observationsWithPhotos.length - index,
                                }}
                                exit={{
                                    x: 300,
                                    opacity: 0,
                                    scale: 0.5,
                                    transition: { duration: 0.3 },
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 100,
                                    damping: 20,
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(event, { offset }) => {
                                    if (Math.abs(offset.x) > 50) {
                                        if (offset.x > 0) {
                                            handlePrev()
                                        } else {
                                            handleNext()
                                        }
                                    }
                                }}
                            >
                                <div className="aspect-square bg-gray-100 rounded-sm overflow-hidden mb-4">
                                    <img
                                        src={obs.photos[0].url.replace(
                                            'square',
                                            'large'
                                        )}
                                        alt="Zoomed observation"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-center text-gray-800 space-y-1">
                                    <p className="font-bold text-lg">
                                        Observed by: {obs.user.login}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-sm text-gray-500 truncate">
                                            📍 {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                <Button
                    variant="neutral"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 rounded-full bg-white z-50"
                    onClick={handlePrev}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                    variant="neutral"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 rounded-full bg-white z-50"
                    onClick={handleNext}
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </DialogContent>
        </Dialog>
    )
}

// List View Component
export function ObservationListView({
    observations,
}: {
    observations: Observation[]
}) {
    return (
        <div className="space-y-3">
            <AnimatePresence>
                {observations.map((obs, index) => (
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
                        <Card className="p-3 cursor-pointer">
                            <div className="flex items-center gap-4">
                                {obs.photos.length > 0 && (
                                    <ProgressiveObservationImage
                                        photo={obs.photos[0]}
                                        className="w-16 h-16 rounded-md flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        Observed by {obs.user.login}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// Map View Component
export function ObservationMapView({
    observations,
    center,
}: {
    observations: Observation[]
    center: [number, number]
}) {
    // Filter observations that have coordinates
    const observationsWithCoords = observations.filter(
        (obs) => obs.geojson?.coordinates || obs.location
    )

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-96 rounded-lg overflow-hidden border"
        >
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="/api/tiles/{z}/{x}/{y}.png"
                />

                {/* Quest center marker */}
                <Marker position={center}>
                    <Popup>Quest Location</Popup>
                </Marker>

                {/* Observation markers */}
                {observationsWithCoords.map((obs) => {
                    const coords = obs.geojson?.coordinates
                        ? ([
                              obs.geojson.coordinates[1],
                              obs.geojson.coordinates[0],
                          ] as [number, number])
                        : obs.location

                    if (!coords) return null

                    return (
                        <Marker key={obs.id} position={coords}>
                            <Popup>
                                <div className="max-w-xs">
                                    {obs.photos.length > 0 && (
                                        <img
                                            src={obs.photos[0].url.replace(
                                                'square',
                                                'medium'
                                            )}
                                            alt="Observation"
                                            className="w-full h-32 object-cover rounded mb-2"
                                        />
                                    )}
                                    <p className="font-medium text-sm">
                                        Observed by {obs.user.login}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {obs.observed_on_string}
                                    </p>
                                    {obs.place_guess && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {obs.place_guess}
                                        </p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </motion.div>
    )
}
