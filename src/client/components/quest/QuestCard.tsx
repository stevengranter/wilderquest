import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { QuestWithTaxa } from '../../../types/types'
import { paths } from '@/routes/paths'
import { useTaxonPhotos } from '@/hooks/useTaxonPhotos'
import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const cn = (...classes: Array<string | undefined | null | false>) =>
    twMerge(clsx(classes))

interface QuestCardProps {
    quest: QuestWithTaxa
    className?: string
    hoverEffect?: 'lift' | 'shadow' | 'none'
    animate?: boolean
}

export function QuestCard({
                              quest,
                              className,
                              hoverEffect = 'lift',
                              animate = false,
                          }: QuestCardProps) {
    const [hoveredImage, setHoveredImage] = useState<number | null>(null)

    const totalTaxaCount = quest.taxon_ids?.length || 0
    // Show max 6 photos in the collage
    const displayPhotoLimit = 6;

    const collageTaxonIds = quest.taxon_ids?.slice(0, displayPhotoLimit) || []
    const { data: collagePhotosData } = useTaxonPhotos(collageTaxonIds)

    const photos: string[] = Array.isArray(collagePhotosData)
        ? collagePhotosData.filter((p): p is string => !!p)
        : []

    // Calculate remaining taxa for the overlay
    const remainingTaxaCount = totalTaxaCount - photos.length;

    // The number of slots to render in the grid (max 6). If totalTaxaCount is 0, gridSlotCount is 0.
    const gridSlotCount = Math.min(totalTaxaCount > 0 ? (totalTaxaCount > 6 ? 6 : totalTaxaCount) : 0, 6);


    // decide grid layout based on count
// Update getGridClasses to only control columns/rows
    const getGridClasses = (n: number) => {
        switch (n) {
            case 1:
                return 'grid-cols-1'
            case 2:
                return 'grid-cols-2 grid-rows-1'
            case 3:
                return 'grid-cols-3 grid-rows-1'
            case 4:
                return 'grid-cols-2 grid-rows-2'
            case 5:
            case 6:
                return 'grid-cols-3 grid-rows-2'
            default:
                return ''
        }
    }


    const formattedDate = quest.starts_at
        ? new Date(quest.starts_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Date TBD'

    const hoverClasses = {
        lift: 'transition-transform duration-200 hover:-translate-1 hover:shadow-shadow hover:scale-105',
        shadow: 'transition-shadow duration-200 hover:shadow-shadow',
        none: '',
    }

    return (
        <Link to={paths.questDetail(quest.id)} className="block">
            <Card
                className={cn(
                    'm-0 p-0 shadow-0 overflow-hidden bg-white border rounded-2xl gap-2 hover:bg-amber-50',
                    hoverClasses[hoverEffect],
                    className
                )}

            >
                {/* Collage only if there are taxa to show */}
                {/* Collage only if there are taxa to show */}
                {totalTaxaCount > 0 && (
                    <CardContent className="p-0 m-0">
                        <div
                            className={cn(
                                'relative w-full grid gap-0',
                                getGridClasses(gridSlotCount)
                            )}
                        >
                            {Array.from({ length: gridSlotCount }).map((_, i) => {
                                const isLastSlot = i === gridSlotCount - 1
                                const shouldShowOverlay = totalTaxaCount > 6 && isLastSlot
                                const photoSrc = photos[i] || '/placeholder.jpg'

                                // For 5 images, center the last one
                                const extraClass =
                                    gridSlotCount === 5 && i === 4 ? 'col-start-2 row-start-2' : ''

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'relative overflow-hidden',
                                            'aspect-[4/3]', // Maintain a consistent aspect ratio
                                            extraClass
                                        )}
                                    >
                                        <img
                                            src={photoSrc}
                                            alt={`Quest wildlife ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {shouldShowOverlay && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold">
                                                +{remainingTaxaCount} more
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                )}


                {/* Text content */}
                <CardContent className="p-4 m-0 space-y-2">
                    <h3 className="text-lg font-semibold text-green-900 line-clamp-1">
                        {quest.name}
                    </h3>

            <div className="truncate">
              {quest.location_name || 'Location TBD'}
            </div>
                        <div>{formattedDate}</div>
                </CardContent>
            </Card>
        </Link>
    )
}
