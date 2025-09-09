import { Link } from 'react-router-dom'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { MdLocationPin } from 'react-icons/md'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import { ClientQuest } from '@/features/quests/components/SpeciesCardWithObservations'
import { QuestTimestamps } from '@/features/quests/components/QuestView/parts/QuestTimestamps'
import {
    Share,
    QuestMapping,
    AggregatedProgress,
    QuestStatus,
} from '@/features/quests/types'
import { QuestStatusBadge } from '../../QuestStatusBadge'
import { TaxaPieChart } from './TaxaPieChart'
import { QuestControls } from './QuestControls'

type QuestHeaderProps = {
    questData: ClientQuest
    isOwner: boolean
    share?: Share
    mappings?: QuestMapping[]
    aggregatedProgress?: AggregatedProgress[]
    isProgressError?: boolean
    isTaxaError?: boolean
    canEdit?: boolean
    updateStatus?: (status: QuestStatus) => void
}

export const QuestHeader = ({
    questData,
    isOwner,
    share,
    mappings,
    aggregatedProgress,
    isProgressError,
    isTaxaError,
    canEdit,
    updateStatus,
}: QuestHeaderProps) => {
    return (
        <div className="relative">
            {/* Header Controls - Responsive layout */}
            {(isOwner || (canEdit && updateStatus)) && (
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:justify-end sm:items-center sm:gap-2 sm:absolute sm:top-0 sm:right-0 sm:z-10">
                    {/* Edit Quest Button */}
                    {isOwner && (
                        <Button
                            variant="reverse"
                            size="sm"
                            className="bg-background w-full sm:w-auto"
                            asChild
                        >
                            <Link to={`/quests/${questData.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Quest
                            </Link>
                        </Button>
                    )}

                    {/* Quest Controls */}
                    {canEdit && updateStatus && (
                        <div className="w-full sm:w-auto">
                            <QuestControls
                                handleActive={() => updateStatus('active')}
                                status={questData.status}
                                handlePaused={() => updateStatus('paused')}
                                handleEnded={() => updateStatus('ended')}
                            />
                        </div>
                    )}
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
                                <MdLocationPin className="h-4 w-4" />
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
