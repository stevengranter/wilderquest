import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTaxonPhotos } from '@/hooks/useTaxonPhotos'
import { QuestWithTaxa } from '../../../types/types'

interface QuestCardProps {
    quest: QuestWithTaxa
}

export function QuestCard({ quest }: QuestCardProps) {
    // Fetch photos for up to 6 other species in the quest
    const thumbnailTaxonIds = quest.taxon_ids?.slice(1, 7) || []
    const { data: thumbnailPhotosData } = useTaxonPhotos(thumbnailTaxonIds)

    const thumbnailPhotos: string[] = Array.isArray(thumbnailPhotosData)
        ? thumbnailPhotosData.filter((p): p is string => !!p)
        : []

    const renderMainPhoto = () => {
        if (!quest.photoUrl) {
            return (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">
                        No photo
                    </span>
                </div>
            )
        }

        return (
            <img
                src={quest.photoUrl}
                alt={`Photo for ${quest.name}`}
                className="w-full h-full object-cover"
            />
        )
    }

    return (
        <Link to={`/quests/${quest.id}`} className="block">
            <Card className="h-full bg-secondary-background shadow-0 hover:-rotate-3 hover:scale-105 hover:shadow-shadow transition-all duration-200 overflow-hidden p-0">
                <CardContent className="overflow-hidden object-cover relative m-0 p-0">
                    {renderMainPhoto()}
                </CardContent>
                <CardContent>
                    {thumbnailPhotos.length > 0 && (
                        <CardContent className="flex items-center">
                            {thumbnailPhotos.map((photo, index) => (
                                <img
                                    key={index}
                                    src={photo}
                                    alt={`Species ${index + 2}`}
                                    className="w-8 h-8 rounded-full border-2 border-secondary-background -ml-3"
                                />
                            ))}
                        </CardContent>
                    )}
                </CardContent>
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
                <CardFooter className="px-6 pb-4 pt-4 flex justify-between items-center">
                    <Badge
                        variant={
                            quest.status === 'active' ? 'default' : 'neutral'
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
                    {quest.taxon_ids && quest.taxon_ids.length > 0 && (
                        <Badge variant="neutral" className="text-xs">
                            {quest.taxon_ids.length} species
                        </Badge>
                    )}
                </CardFooter>
            </Card>
        </Link>
    )
}
