import { Link } from 'react-router-dom'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { FaMapPin } from 'react-icons/fa'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import { paths } from '@/core/routing/paths'
import { ClientQuest } from '@/features/quests/components/SpeciesCardWithObservations'
import { QuestTimestamps } from '@/features/quests/components/QuestView/parts/QuestTimestamps'
import {
    Share,
    QuestMapping,
    AggregatedProgress,
} from '@/features/quests/types'
import { QuestStatusBadge } from '../../QuestStatusBadge'
import { TaxaPieChart } from './TaxaPieChart'

type QuestHeaderProps = {
    questData: ClientQuest
    isOwner: boolean
    share?: Share
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    isProgressError?: boolean
    isTaxaError?: boolean
}

export const QuestHeader = ({
    questData,
    isOwner,
    share,
    mappings,
    aggregatedProgress,
    isProgressError,
    isTaxaError,
}: QuestHeaderProps) => {
    return (
        <div className="relative">
            {/* Edit Quest Button - Always in upper right */}
            {isOwner && (
                <div className="absolute top-0 right-0 z-10">
                    <Button
                        variant="reverse"
                        size="sm"
                        className="bg-background"
                        asChild
                    >
                        <Link to={paths.editQuest(questData.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Quest
                        </Link>
                    </Button>
                </div>
            )}

            <div className="flex flex-row justify-between items-start">
                <div className="flex flex-nowrap gap-4 md:flex-row md:items-start md:gap-6 w-full">
                    {/* Progress Chart - Left column on xl+ screens */}
                    <div className="flex flex-col items-end gap-4 flex-shrink-0 w-40 sm:w-auto xl:order-1">
                        {/* Quest Progress Chart */}
                        {mappings &&
                            mappings.length > 0 &&
                            !isProgressError &&
                            !isTaxaError && (
                                <div className="flex-shrink-0">
                                    <div className="w-32 h-32">
                                        {(() => {
                                            const total = mappings.length
                                            const found =
                                                aggregatedProgress?.filter(
                                                    (a) => (a.count || 0) > 0
                                                ).length || 0
                                            return (
                                                <TaxaPieChart
                                                    found={found}
                                                    total={total}
                                                    questStatus={
                                                        questData.status
                                                    }
                                                />
                                            )
                                        })()}
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Quest Info - Right column on xl+ screens */}
                    <div className="flex flex-col flex-1 min-w-0 xl:order-2">
                        <h2 className="text-3xl font-bold text-primary">
                            {questData.name}
                        </h2>
                        {questData?.location_name && (
                            <h3 className="flex items-center gap-2">
                                <FaMapPin className="h-4 w-4" />
                                {questData?.location_name}
                            </h3>
                        )}
                        <div className="flex items-center gap-3 mt-2">
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
                        <QuestTimestamps
                            startsAt={questData.starts_at || undefined}
                            endsAt={questData.ends_at || undefined}
                        />
                    </div>
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
            </div>
        </div>
    )
}
