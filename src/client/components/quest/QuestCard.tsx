import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { QuestWithTaxa } from '../../../types/types'
import { paths } from '@/routes/paths'
import { useQuestPhotoCollage } from '@/hooks/useTaxonPhotos'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MdLocationPin } from 'react-icons/md'
import { IoMdCompass } from 'react-icons/io'
import { QuestCardSkeleton } from './QuestCardSkeleton'

const cn = (...classes: Array<string | undefined | null | false>) =>
    twMerge(clsx(classes))

interface QuestCardProps {
    quest: QuestWithTaxa
    className?: string
    hoverEffect?: 'lift' | 'shadow' | 'none'
    animate?: boolean
    photos?: string[]
    isLoading?: boolean
}

function QuestCardContent({ quest, className, hoverEffect, photos, isLoading }: QuestCardProps) {
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
        lift: 'transition-transform duration-200 hover:-translate-1 hover:shadow-shadow',
        shadow: 'transition-shadow duration-200 hover:shadow-shadow',
        none: '',
    }

    return (
        <Link to={paths.questDetail(quest.id)} className="block">
            <Card
                className={cn(
                    'm-0 p-0 shadow-0 overflow-hidden bg-white border rounded-2xl gap-2 hover:bg-orange-50',
                    hoverClasses[hoverEffect || 'lift'],
                    className
                )}
            >
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
                                            'aspect-[4/3]',
                                            extraClass,
                                            !photoSrc && 'bg-gray-100'
                                        )}
                                    >
                                        <img
                                            src={photoSrc || '/placeholder.jpg'}
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

                <CardContent className="px-4 py-2 m-0 space-y-1 relative">
                    <IoMdCompass className="z-5 absolute -top-2 -right-12 -translate-x-1/2 text-orange-200 opacity-20 w-28 h-28 pointer-events-none" />

                    <h3 className="text-lg font-semibold text-green-900 line-clamp-1 z-10 relative">
                        {quest.name}
                    </h3>

                    <div className="text-xs">{formattedDate}</div>
                </CardContent>
                <CardFooter className="relative m-0 p-2 bg-orange-100 z-10">
                    <div className="flex flex-row items-center justify-right relative z-10">
                        <MdLocationPin />
                        <h4 className="truncate text-xs font-normal ">
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

    return <QuestCardContent {...props} photos={photos} isLoading={isLoading} />
}

export function QuestCard(props: QuestCardProps) {
    if (props.isLoading) {
        return <QuestCardSkeleton />
    }

    if (props.photos !== undefined && props.isLoading !== undefined) {
        return <QuestCardContent {...props} />
    }

    return <QuestCardWithData {...props} />
}
