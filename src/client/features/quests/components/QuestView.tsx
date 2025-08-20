import { INatTaxon } from '@shared/types/iNatTypes'
import { isSameDay, isSameYear } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Lock, LockOpen, Pause, Pencil, Play, StopCircle } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import api from '@/api/api'
import { SpeciesCardSkeleton } from '@/components/cards/SpeciesCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ShareQuest from '@/features/quests/components/ShareQuest'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import { Quest } from '../../../../server/repositories/QuestRepository'

type QuestViewProps = {
    questData: Quest | null | undefined;
    taxa: INatTaxon[] | undefined;
    mappings: any[] | undefined;
    aggregatedProgress: any[] | undefined;
    detailedProgress: any[] | undefined;
    isLoading: boolean;
    isTaxaLoading: boolean;
    isError: boolean;
    updateStatus: (status: 'pending' | 'active' | 'paused' | 'ended') => void;
    isOwner: boolean;
    token?: string;
    share?: any;
    leaderboard?: any[];
};



function QuestTimestamps({ startsAt, endsAt }: { startsAt?: Date, endsAt?: Date }) {
    if (!startsAt) return null;

    const now = new Date();
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;

    // Auto-detect user's timezone or set a default
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const isActive = start <= now && (!end || end >= now);
    const hasEnded = end && end < now;
    const isUpcoming = start > now;

    const getDisplayText = () => {
        if (isUpcoming) {
            const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `Starts in ${days} day${days !== 1 ? 's' : ''}`;
        }
        if (hasEnded) return 'Ended';
        if (end) {
            const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return `${days} day${days !== 1 ? 's' : ''} left`;
        }
        return 'Active';
    };

    const formatCompactDateTime = () => {
        const currentYear = now.getFullYear();
        const includeStartYear = !isSameYear(start, now);
        const includeEndYear = end && !isSameYear(end, now);

        if (!end) {
            // Just start time
            const dateFormat = includeStartYear ? 'MMM d, yyyy, h:mm a (zzz)' : 'MMM d, h:mm a (zzz)';
            return formatInTimeZone(start, timeZone, dateFormat);
        }

        const isSameDayResult = isSameDay(start, end);

        if (isSameDayResult) {
            // Same day
            const dateFormat = includeStartYear ? 'MMM d, yyyy' : 'MMM d';
            const dateStr = formatInTimeZone(start, timeZone, dateFormat);
            const startTime = formatInTimeZone(start, timeZone, 'h:mm a');
            const endTime = formatInTimeZone(end, timeZone, 'h:mm a');
            const timezone = formatInTimeZone(end, timeZone, '(zzz)');

            return `${dateStr}, ${startTime} - ${endTime} ${timezone}`;
        } else {
            // Different days
            const startFormat = includeStartYear ? 'MMM d, yyyy, h:mm a' : 'MMM d, h:mm a';
            const endFormat = includeEndYear ? 'MMM d, yyyy, h:mm a' : 'MMM d, h:mm a';

            const startStr = formatInTimeZone(start, timeZone, startFormat);
            const endStr = formatInTimeZone(end, timeZone, endFormat);
            const timezone = formatInTimeZone(end, timeZone, '(zzz)');

            return `${startStr} - ${endStr} ${timezone}`;
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Compact Status Badge */}
            <div
                className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${isActive ? 'bg-green-100 text-green-800' :
                    hasEnded ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-800'}
                `}
            >
                {getDisplayText()}
            </div>

            {/* Compact Date/Time Display */}
            <div className="text-sm text-muted-foreground">
                {!end ? (
                    <span>Starts {formatCompactDateTime()}</span>
                ) : (
                    <span>{formatCompactDateTime()}</span>
                )}
            </div>
        </div>
    );
}

export const QuestView = ({
    questData,
    taxa,
    mappings,
    aggregatedProgress,
    detailedProgress,
    isLoading,
    isTaxaLoading,
    isError,
    updateStatus,
    isOwner,
    token,
    share,
    leaderboard,
}: QuestViewProps) => {
    const { user } = useAuth();

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (isError) {
        return <ErrorState error="Failed to load quest data." />;
    }

    if (!questData) {
        return <EmptyState />;
    }

    const taxaWithProgress =
        taxa?.map((taxon) => {
            const mapping = mappings?.find((m) => m.taxon_id === taxon.id);
            const progressCount =
                mapping?.id && aggregatedProgress
                    ? aggregatedProgress.find((p) => p.mapping_id === mapping.id)
                          ?.count || 0
                    : 0;
            const recentEntries =
                mapping?.id && detailedProgress
                    ? detailedProgress
                          .filter((d) => d.mapping_id === mapping.id)
                          .slice(0, 3)
                    : [];
            return { ...taxon, mapping, progressCount, recentEntries };
        }) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-row justify-between align-middle">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-bold text-primary">
                            {questData.name}
                        </h2>
                        {questData?.location_name && (
                            <h3>Location: {questData?.location_name}</h3>
                        )}
                        <QuestTimestamps startsAt={questData.starts_at} endsAt={questData.ends_at} timeZone={questData.timezone} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {questData.is_private ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <LockOpen className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </div>
            {isOwner && (
                <QuestStatusControls
                    handleActive={() => updateStatus('active')}
                    status={questData.status}
                    handlePaused={() => updateStatus('paused')}
                    handleEnded={() => updateStatus('ended')}
                />
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-muted-foreground mt-2">
                        {questData.description}
                    </p>
                    {!isOwner && questData?.username && (
                        <h4>
                            Organizer: <Link to={`/users/${questData.username}`}>{questData.username}</Link>
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
                        <ShareQuest
                            questId={Number(questData.id)}
                            ownerUserId={Number(questData.user_id)}
                        />
                    </div>
                )}
            </div>

            <div className="mt-8">
                {mappings && mappings.length > 0 && (
                    <div className="mb-2 text-sm">
                        {(() => {
                            const total = mappings.length;
                            const found =
                                aggregatedProgress?.filter(
                                    (a) => (a.count || 0) > 0
                                ).length || 0;
                            return (
                                <span className="inline-block bg-emerald-600 text-white px-2 py-0.5 rounded">
                                    {found}/{total} Found
                                </span>
                            );
                        })()}
                    </div>
                )}
                <h2 className="text-xl font-semibold mb-4">
                    Species ({taxa?.length ?? '...'})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                    {taxaWithProgress.map((taxon) => (
                        <div key={taxon.id} className="relative">
                            <SpeciesCardWithObservations
                                species={taxon}
                                questData={questData}
                                found={taxon.progressCount > 0}
                            />
                            {(isOwner || token) && taxon.mapping && (
                                <div className="absolute bottom-2 right-2">
                                    <Button
                                        size="sm"
                                        variant="neutral"
                                        disabled={questData.status !== 'active'}
                                        onClick={async () => {
                                            try {
                                                let progress;
                                                if (isOwner) {
                                                    progress = detailedProgress?.find(
                                                        (p) =>
                                                            p.display_name === user?.username &&
                                                            p.mapping_id === taxon.mapping.id
                                                    );
                                                } else if (token) {
                                                    progress = detailedProgress?.find(
                                                        (p) =>
                                                            p.display_name === share?.guest_name &&
                                                            p.mapping_id === taxon.mapping.id
                                                    );
                                                }
                                                const next = !progress;
                                                if (isOwner) {
                                                    await api.post(
                                                        `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping.id}`,
                                                        { observed: next }
                                                    );
                                                } else if (token) {
                                                    await api.post(
                                                        `/quest-sharing/shares/token/${token}/progress/${taxon.mapping.id}`,
                                                        { observed: next }
                                                    );
                                                }
                                                console.log('Progress updated');
                                            } catch (e) {
                                                toast.error('Action failed');
                                            }
                                        }}
                                    >
                                        Found
                                    </Button>
                                </div>
                            )}
                            {taxon.progressCount > 0 && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-md shadow">
                                        <div>
                                            Found
                                            {taxon.progressCount > 1 ? ` x${taxon.progressCount}` : ''}
                                        </div>
                                        {taxon.mapping && (
                                            <div className="text-[10px] opacity-90 mt-0.5">
                                                {(() => {
                                                    const meta = aggregatedProgress?.find(
                                                        (p) => p.mapping_id === taxon.mapping.id
                                                    );
                                                    if (!meta) return null;
                                                    const ts = meta.last_observed_at;
                                                    const name = (meta as any).last_display_name || 'Someone';
                                                    try {
                                                        const d = ts ? new Date(ts) : null;
                                                        const formatted = d ? d.toLocaleString() : '';
                                                        return `${name} • ${formatted}`;
                                                    } catch {
                                                        return name;
                                                    }
                                                })()}
                                            </div>
                                        )}
                                        {taxon.recentEntries && taxon.recentEntries.length > 0 && (
                                            <div className="text-[10px] opacity-90 mt-1">
                                                {taxon.recentEntries.map((e: any) => {
                                                    const d = new Date(e.observed_at);
                                                    return (
                                                        <div key={e.progress_id}>
                                                            {e.display_name || 'Someone'} • {d.toLocaleString()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isTaxaLoading &&
                        Array.from({
                            length: questData?.taxon_ids?.length || taxa?.length || 10,
                        }).map((_, i) => <SpeciesCardSkeleton key={i} />)}
                </div>
            </div>

            {leaderboard && leaderboard.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
                    <div className="space-y-2">
                        {leaderboard.map((entry: any, index: number) => (
                            <div
                                key={index}
                                className="flex justify-between items-center p-2 bg-gray-100 rounded-md"
                            >
                                <span className="font-medium">
                                    {index + 1}. {entry.display_name || 'Anonymous'}
                                </span>
                                <span className="text-lg font-bold">{entry.observation_count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function QuestStatusControls(props: {
    handleActive: () => void;
    status: any;
    handlePaused: () => void;
    handleEnded: () => void;
}) {
    return (
        <div className="flex items-center gap-2 w-full">
            <Button
                className="flex-1"
                onClick={props.handleActive}
                disabled={props.status === 'active'}
            >
                <Play /> {props.status === 'pending' ? 'Start' : 'Resume'}
            </Button>
            <Button
                className="flex-1"
                onClick={props.handlePaused}
                disabled={props.status === 'paused' || props.status === 'pending'}
            >
                <Pause /> Pause
            </Button>
            <Button
                className="flex-1"
                onClick={props.handleEnded}
                disabled={props.status === 'ended'}
            >
                <StopCircle /> End
            </Button>
        </div>
    );
}

function QuestStatus(props: { status: any }) {
    return (
        <Badge className="mt-4 flex items-center gap-2">
            <span
                className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-2 ${
                    props.status === 'pending'
                        ? 'bg-gray-200 text-gray-700'
                        : props.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : props.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                }`}
            >
                {props.status === 'pending' && <Lock className="h-4 w-4" />}
                {props.status === 'active' && <Play className="h-4 w-4" />}
                {props.status === 'paused' && <Pause className="h-4 w-4" />}
                {props.status === 'ended' && <StopCircle className="h-4 w-4" />}
                <span className="capitalize">{props.status}</span>
            </span>
        </Badge>
    );
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-4 w-2/3 mb-8" />
                <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                </div>
            </Card>
        </div>
    );
}

function ErrorState({ error }: { error: string }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6 text-center">
                <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground">{error}</p>
            </Card>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">No Quest Found</h2>
                <p className="text-muted-foreground mb-4">
                    Please select a collection or navigate to a valid collection ID.
                </p>
                <Button variant="default" asChild>
                    <a href="/quests">View All Quests</a>
                </Button>
            </Card>
        </div>
    );
}
