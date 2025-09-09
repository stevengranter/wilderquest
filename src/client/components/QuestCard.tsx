import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { QuestWithTaxa } from '../types/questTypes'
import { useQuestPhotoCollage } from '@/hooks/useTaxonPhotos'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MdLocationPin } from 'react-icons/md'
import { IoMdCompass } from 'react-icons/io'
import { QuestCardSkeleton } from './QuestCardSkeleton'
import { FaRegImage } from 'react-icons/fa'
import { QuestStatusBadge } from './QuestStatusBadge'

const cn = (...classes: Array<string | undefined | null | false>) =>
    twMerge(clsx(classes))

// Component for individual image skeletons in the collage
function ImageSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'relative h-auto overflow-hidden bg-gray-50 flex items-center justify-center transition-all duration-300 ease-in-out',
                className
            )}
        >
            <div className="animate-pulse text-gray-300 text-3xl transform transition-transform duration-700 ease-in-out">
                <FaRegImage />
            </div>
        </div>
    )
}

interface QuestCardProps {
    quest: QuestWithTaxa
    className?: string
    hoverEffect?: 'lift' | 'shadow' | 'none'
    animate?: boolean
    photos?: string[]
    isLoading?: boolean
    observeQuest?: (questId: number, element: HTMLElement | null) => void
    enableCollageZoom?: boolean
    scaleTextToFit?: boolean
}

function QuestCardContent({
    quest,
    className,
    hoverEffect,
    photos,
    isLoading,
    observeQuest,
    enableCollageZoom = false,
    scaleTextToFit = false,
}: QuestCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (observeQuest && cardRef.current) {
            observeQuest(quest.id, cardRef.current)
        }
    }, [observeQuest, quest.id])
    const totalTaxaCount = quest.taxon_ids?.length || 0
    const remainingTaxaCount = totalTaxaCount - (photos?.length || 0)
    const gridSlotCount = Math.min(
        totalTaxaCount > 0 ? (totalTaxaCount > 6 ? 6 : totalTaxaCount) : 0,
        6
    )

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
        lift: 'transition-all duration-250 hover:-translate-1 hover:shadow-shadow',
        shadow: 'transition-shadow duration-200 hover:shadow-shadow',
        none: '',
    }

    if (isLoading) {
        return <QuestCardSkeleton />
    }

    return (
        <Link to={`/quests/${quest.id}`} className="block">
            <Card
                className={cn(
                    'm-0 p-0 shadow-0 overflow-hidden border rounded-xl gap-2 hover:bg-orange-50 relative group bg-white',
                    hoverClasses[hoverEffect || 'lift'],
                    className
                )}
            >
                <CardContent className="p-0 m-0 bg-background">
                    <div className="relative w-full h-40 overflow-hidden">
                        <div
                            className={cn(
                                'absolute inset-0 transition-all duration-500 ease-out',
                                enableCollageZoom &&
                                    'group-hover:scale-110 group-hover:saturate-110',
                                totalTaxaCount > 0
                                    ? `grid ${getGridClasses(gridSlotCount)}`
                                    : 'flex items-center justify-center bg-orange-50'
                            )}
                            style={{
                                transformOrigin: 'center',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                ...(enableCollageZoom && {
                                    willChange: 'transform',
                                }),
                            }}
                        >
                            {totalTaxaCount > 0 ? (
                                Array.from({ length: gridSlotCount }).map(
                                    (_, i) => {
                                        const isLastSlot =
                                            i === gridSlotCount - 1
                                        const shouldShowOverlay =
                                            totalTaxaCount > 6 && isLastSlot
                                        const photoSrc = photos?.[i]

                                        const extraClass =
                                            gridSlotCount === 5 && i === 4
                                                ? 'col-start-2 row-start-2'
                                                : ''

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    'relative overflow-hidden',
                                                    extraClass
                                                )}
                                            >
                                                {isLoading || !photoSrc ? (
                                                    <ImageSkeleton
                                                        className={extraClass}
                                                    />
                                                ) : (
                                                    <img
                                                        src={photoSrc}
                                                        alt={`Quest wildlife ${
                                                            i + 1
                                                        }`}
                                                        className="w-full h-full object-cover transition-opacity duration-300"
                                                        // style={{
                                                        //     imageRendering:
                                                        //         '-webkit-optimize-contrast',
                                                        //     backfaceVisibility:
                                                        //         'hidden',
                                                        //     transform:
                                                        //         'translateZ(0)',
                                                        // }}
                                                    />
                                                )}
                                                {shouldShowOverlay &&
                                                    photoSrc &&
                                                    !isLoading && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-semibold">
                                                            +
                                                            {remainingTaxaCount}{' '}
                                                            more
                                                        </div>
                                                    )}
                                            </div>
                                        )
                                    }
                                )
                            ) : (
                                <p className="text-gray-500">No wildlife yet</p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardContent className="px-4 pr-4 py-2 m-0 space-y-1 relative">
                    <IoMdCompass className="z-5 absolute -top-2 -right-3 -translate-x-1/2 text-orange-200 opacity-20 w-28 h-28 pointer-events-none" />

                    <div className="z-10 relative w-full">
                        <h3
                            className={cn(
                                'font-semibold text-green-900 overflow-hidden w-full',
                                scaleTextToFit
                                    ? 'text-sm leading-tight whitespace-nowrap'
                                    : 'text-lg line-clamp-1'
                            )}
                            style={
                                scaleTextToFit
                                    ? {
                                          fontSize: `clamp(0.875rem, ${Math.max(0.875, Math.min(1, 40 / quest.name.length))}rem, 1rem)`,
                                      }
                                    : undefined
                            }
                        >
                            {quest.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between z-10 relative w-full">
                        <div className="text-xs">{formattedDate}</div>
                        <QuestStatusBadge status={quest.status} />
                    </div>
                </CardContent>
                <CardFooter className="relative m-0 p-2 bg-orange-100 z-10">
                    <div className="flex flex-row items-center justify-right relative z-10">
                        <MdLocationPin />
                        <h4
                            className="text-xs font-normal truncate"
                            style={{
                                fontSize: `clamp(0.75rem, ${Math.max(0.75, Math.min(0.875, 30 / (quest.location_name || '').length))}rem, 0.875rem)`,
                            }}
                        >
                            {quest.location_name || 'Location TBD'}
                        </h4>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}

function QuestCardWithData(props: QuestCardProps) {
    const { questToPhotosMap, isLoading } = useQuestPhotoCollage([props.quest])
    const photos = questToPhotosMap.get(props.quest.id)

    return (
        <QuestCardContent
            {...props}
            photos={photos}
            isLoading={isLoading}
            observeQuest={props.observeQuest}
            enableCollageZoom={props.enableCollageZoom}
            scaleTextToFit={props.scaleTextToFit}
        />
    )
}

export function QuestCard(props: QuestCardProps) {
    if (props.isLoading) {
        return <QuestCardSkeleton />
    }

    if (props.photos !== undefined && props.isLoading !== undefined) {
        return (
            <QuestCardContent
                {...props}
                observeQuest={props.observeQuest}
                enableCollageZoom={props.enableCollageZoom}
                scaleTextToFit={props.scaleTextToFit}
            />
        )
    }

    return <QuestCardWithData {...props} />
}
