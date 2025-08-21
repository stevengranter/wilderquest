import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
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
    /** when true, enable image hover animations */
    animate?: boolean
}

export function QuestCard({
                              quest,
                              className,
                              hoverEffect = 'lift',
                              animate = false, // <-- animate means "enable animations"
                          }: QuestCardProps) {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null)

    const collageTaxonIds = quest.taxon_ids?.slice(0, 3) || []
    const { data: collagePhotosData } = useTaxonPhotos(collageTaxonIds)

    const photos: string[] = Array.isArray(collagePhotosData)
        ? collagePhotosData.filter((p): p is string => !!p)
        : []

    const photoSlots = Array.from({ length: 3 }, (_, i) => photos[i] || '/placeholder.jpg')

    const formattedDate = quest.starts_at
        ? new Date(quest.starts_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Date TBD'

    const hoverClasses = {
        lift: 'transition-all duration-200 hover:-translate-2 hover:shadow-shadow',
        shadow: 'transition-all duration-200 hover:shadow-shadow',
        none: '',
    }

    // Only attach handlers when animations are enabled
    const maybeHover = (img: string) => (animate ? () => setHoveredImage(img) : undefined)
    const maybeResetHover = animate ? () => setHoveredImage(null) : undefined

    return (
        <Link to={paths.questDetail(quest.id)} className="block w-full">
            <Card
                className={cn(
                    'overflow-hidden shadow-0 bg-amber-50 border-1 p-2 m-0 rounded-xl w-full',
                    hoverClasses[hoverEffect],
                    className
                )}
                onMouseLeave={maybeResetHover}
            >
                <div className="p-2 space-y-2" onMouseLeave={maybeResetHover}>
                    {/* First row */}
                    <div className="flex h-48 gap-3">
                        <div
                            className={cn(
                                'overflow-hidden rounded-xl',
                                animate
                                    ? clsx(
                                        'transition-all duration-300 ease-in-out opacity-80 hover:opacity-100',
                                        hoveredImage === 'img1'
                                            ? 'flex-1'
                                            : hoveredImage === 'img2'
                                                ? 'w-0'
                                                : 'flex-1'
                                    )
                                    : 'flex-1 opacity-100'
                            )}
                            onMouseEnter={maybeHover('img1')}
                        >
                            <img src={photoSlots[0]} alt="Quest wildlife 1" className="w-full h-full object-cover" />
                        </div>

                        <div
                            className={cn(
                                'overflow-hidden rounded-xl',
                                animate
                                    ? clsx(
                                        'transition-all duration-300 ease-in-out opacity-80 hover:opacity-100',
                                        hoveredImage === 'img2'
                                            ? 'flex-1'
                                            : hoveredImage === 'img1'
                                                ? 'w-0'
                                                : 'flex-1'
                                    )
                                    : 'flex-1 opacity-100'
                            )}
                            onMouseEnter={maybeHover('img2')}
                        >
                            <img src={photoSlots[1]} alt="Quest wildlife 2" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Second row */}
                    <div className="flex h-64 gap-3">
                        <div
                            className={cn(
                                'overflow-hidden rounded-xl flex-1',
                                animate
                                    ? 'transition-all duration-300 ease-in-out opacity-80 hover:opacity-100'
                                    : 'opacity-100'
                            )}
                            onMouseEnter={maybeHover('img3')}
                        >
                            <img src={photoSlots[2]} alt="Quest wildlife 3" className="w-full h-full object-cover" />
                        </div>

                        <div
                            className={cn(
                                animate
                                    ? clsx(
                                        'transition-all duration-300 ease-in-out',
                                        hoveredImage === 'img3' ? 'w-0' : 'flex-1'
                                    )
                                    : 'flex-1'
                            )}
                        >
                            <div
                                className={cn(
                                    'rounded-xl flex flex-col h-full',
                                    animate
                                        ? clsx(
                                            'transition-opacity duration-300',
                                            hoveredImage === 'img3' ? 'opacity-0' : 'opacity-100'
                                        )
                                        : 'opacity-100'
                                )}
                            >
                                <div className="flex-[2] bg-secondary-background flex items-center justify-center text-center rounded-xl p-2 min-h-0">
                                    <h3 className="text-base text-green-800 tracking-wider leading-tight overflow-hidden">
                                        {quest.name}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Third row */}
                    <div className="bg-green-800 rounded-xl px-4 py-3 text-center mx-1">
                        <p className="text-white font-bold text-sm uppercase tracking-wide">
                            <div className="truncate">{quest.location_name || 'Location TBD'}</div>
                            <div>{formattedDate}</div>
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
