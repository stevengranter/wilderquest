import { Link } from 'react-router-dom'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { paths } from '@/core/routing/paths'
import { ClientQuest } from '@/features/quests/components/SpeciesCardWithObservations'
import { QuestTimestamps } from '@/features/quests/components/QuestView/parts/QuestTimestamps'
import { Share } from '@/features/quests/types'
import { QuestStatusBadge } from '../../QuestStatusBadge'

type QuestHeaderProps = {
    questData: ClientQuest
    isOwner: boolean
    share?: Share
}

export const QuestHeader = ({
    questData,
    isOwner,
    share,
}: QuestHeaderProps) => {
    return (
        <div>
            <div className="flex flex-row justify-between align-middle">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-bold text-primary">
                        {questData.name}
                    </h2>
                    {questData?.location_name && (
                        <h3>Location: {questData?.location_name}</h3>
                    )}
                    <QuestTimestamps
                        startsAt={questData.starts_at || undefined}
                        endsAt={questData.ends_at || undefined}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <QuestStatusBadge status={questData.status} />
                    {questData.is_private ? (
                        <Badge>
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            Private
                        </Badge>
                    ) : (
                        <Badge>
                            <LockOpen className="h-5 w-5 text-muted-foreground" />
                            Public
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-muted-foreground mt-2">
                        {questData.description}
                    </p>
                    {!isOwner && questData?.username && (
                        <h4>
                            Organizer:{' '}
                            <Link to={`/users/${questData.username}`}>
                                {questData.username}
                            </Link>
                        </h4>
                    )}
                    {!isOwner && share?.guest_name && (
                        <h4 className="text-primary font-medium">
                            Participating as: {share.guest_name}
                        </h4>
                    )}
                </div>
                {isOwner && (
                    <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" asChild>
                            <Link to={paths.editQuest(questData.id)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Quest
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
