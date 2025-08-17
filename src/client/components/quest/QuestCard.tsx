import { useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { QuestWithTaxa } from '../../../types/types'

interface QuestCardProps {
    quest: QuestWithTaxa
    photo?: string
}

export function QuestCard({ quest, photo }: QuestCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    return (
        <Link to={`/quests/${quest.id}`} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden p-0">
                {photo && (
                    <div className="h-48 overflow-hidden relative">
                        {!imageLoaded && !imageError && (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
                            </div>
                        )}

                        <img
                            src={photo}
                            alt={`Photo from ${quest.name}`}
                            className={`w-full h-full object-cover transition-all duration-300 hover:scale-110 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => {
                                setImageLoaded(true)
                                setImageError(false)
                            }}
                            onError={() => {
                                setImageError(true)
                                setImageLoaded(false)
                            }}
                        />
                    </div>
                )}
                <CardHeader className="px-6 pt-4 pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                {quest.name}
                            </CardTitle>
                        </div>
                        {quest.is_private && (
                            <Badge variant="neutral" className="ml-2">
                                Private
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                {quest.description && (
                    <CardContent className="px-6 pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {quest.description}
                        </p>
                    </CardContent>
                )}
                <CardFooter className="px-6 pb-4 pt-2 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <Badge
                            variant={
                                quest.status === 'active'
                                    ? 'default'
                                    : 'neutral'
                            }
                            className="text-xs"
                        >
                            {quest.status === 'active'
                                ? '🟢'
                                : quest.status === 'paused'
                                  ? '⏸️'
                                  : '🏁'}{' '}
                            {quest.status}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        {quest.taxon_ids && quest.taxon_ids.length > 0 && (
                            <Badge variant="neutral" className="text-xs">
                                {quest.taxon_ids.length} species
                            </Badge>
                        )}
                        {quest.status === 'ended' && (
                            <Badge variant="neutral" className="text-xs">
                                0 found
                            </Badge>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
