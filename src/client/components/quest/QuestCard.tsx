import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { QuestWithTaxa } from '../../../types/types'
import { paths } from '@/routes/paths'
import { useTaxonPhotos } from '@/hooks/useTaxonPhotos'
import { MapPin } from 'lucide-react'
import { useState } from 'react'

interface QuestCardProps {
    quest: QuestWithTaxa
}

export function QuestCard({ quest }: QuestCardProps) {
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

    return (
        <Link to={paths.questDetail(quest.id)} className="block">
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-cream rounded-2xl max-w-sm">
                <div className="p-2 space-y-2" onMouseLeave={() => setHoveredImage(null)}>
                    {/* First row - Two square images */}
                    <div className="flex h-48">
                        <div
                            className={`transition-all duration-300 ease-in-out ${hoveredImage === 'img1' ? 'w-full' : hoveredImage === 'img2' ? 'w-0 p-0' : 'w-1/2'} p-1`}
                            onMouseEnter={() => setHoveredImage('img1')}
                        >
                            <div className="overflow-hidden rounded-xl h-full">
                                <img
                                    src={photoSlots[0]}
                                    alt="Quest wildlife 1"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div
                            className={`transition-all duration-300 ease-in-out ${hoveredImage === 'img2' ? 'w-full' : hoveredImage === 'img1' ? 'w-0 p-0' : 'w-1/2'} p-1`}
                            onMouseEnter={() => setHoveredImage('img2')}
                        >
                            <div className="overflow-hidden rounded-xl h-full">
                                <img
                                    src={photoSlots[1]}
                                    alt="Quest wildlife 2"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Second row - Portrait image and map/title section */}
                    <div className="flex h-64">
                        <div
                            className={`transition-all duration-300 ease-in-out ${hoveredImage === 'img3' ? 'w-full' : 'w-1/2'} p-1`}
                            onMouseEnter={() => setHoveredImage('img3')}
                        >
                            <div className="overflow-hidden rounded-xl h-full">
                                <img
                                    src={photoSlots[2]}
                                    alt="Quest wildlife 3"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div
                            className={`transition-all duration-300 ease-in-out ${hoveredImage === 'img3' ? 'w-0 p-0' : 'w-1/2'} p-1`}>
                            <div
                                className={`bg-orange-50 rounded-xl flex flex-col h-full transition-opacity duration-300 ${hoveredImage === 'img3' ? 'opacity-0' : 'opacity-100'}`}>
                                {/* Map section - 1/3 height */}
                                <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
                                    <div className="text-green-700 mb-1">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2L8 8h2v12h4V8h2l-4-6z" />
                                        </svg>
                                    </div>

                                    {/* Map pin */}
                                    <div className="bg-orange-500 rounded-full p-1.5 shadow-lg">
                                        <MapPin className="w-3 h-3 text-white fill-white" />
                                    </div>
                                </div>

                                {/* Quest title - 2/3 height */}
                                <div className="flex-[2] flex items-center justify-center text-center p-2 min-h-0">
                                    <h3 className="text-base font-black text-green-800 uppercase tracking-wider leading-tight overflow-hidden">
                                        {quest.name.split(' ').map((word, idx) => (
                                            <div key={idx} className="truncate">
                                                {word}
                                            </div>
                                        ))}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Third row - Location and date */}
                    <div className="bg-green-800 rounded-xl px-4 py-3 text-center mx-1">
                        <p className="text-white font-bold text-sm uppercase tracking-wide">
                            <span>{quest.location_name || 'Location TBD'}</span>
                            <span className="mx-2">&bull;</span>
                            <span>{formattedDate}</span>
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
