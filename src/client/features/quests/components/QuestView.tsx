import { INatTaxon } from '@shared/types/iNatTypes'
import { Lock, LockOpen, Pause, Pencil, Play, StopCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import ShareQuest from '@/features/quests/components/ShareQuest'
import { useAuth } from '@/hooks/useAuth'
import api from '@/api/api'
import { toast } from 'sonner'
import { Quest } from '@/types/types'

type QuestViewProps = {
    questData: Quest | null | undefined;
    taxa: INatTaxon[] | undefined;
    mappings: any[] | undefined;
    aggregatedProgress: any[] | undefined;
    detailedProgress: any[] | undefined;
    isLoading: boolean;
    isError: boolean;
    updateStatus: (status: 'pending' | 'active' | 'paused' | 'ended') => void;
    isOwner: boolean;
    token?: string;
    share?: any;
};

export const QuestView = ({
    questData,
    taxa,
    mappings,
    aggregatedProgress,
    detailedProgress,
    isLoading,
    isError,
    updateStatus,
    isOwner,
    token,
    share,
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

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-card p-6 rounded-lg shadow-lg">
                <div className="flex flex-row justify-between align-middle">
                    <h1 className="text-3xl font-bold text-primary">
                        {questData.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        {questData.is_private ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <LockOpen className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    {questData.status && (
                        <div className="mt-4 flex items-center gap-2">
                            <span
                                className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-2 ${
                                    questData.status === 'pending' ? 'bg-gray-200 text-gray-700' :
                                        questData.status === 'active' ? 'bg-green-100 text-green-800' :
                                            questData.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                }`}
                            >
                                {questData.status === 'pending' && <Lock className="h-4 w-4" />}
                                {questData.status === 'active' && <Play className="h-4 w-4" />}
                                {questData.status === 'paused' && <Pause className="h-4 w-4" />}
                                {questData.status === 'ended' && <StopCircle className="h-4 w-4" />}
                                <span className="capitalize">{questData.status}</span>
                            </span>
                        </div>
                    )}
                </div>
                {isOwner && (
                    <div className="flex items-center gap-2 w-full">
                        <Button
                            className="flex-1"
                            onClick={() => updateStatus('active')}
                            disabled={questData.status === 'active'}
                        >
                            <Play /> {questData.status === 'pending' ? 'Start' : 'Resume'}
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => updateStatus('paused')}
                            disabled={questData.status === 'paused' || questData.status === 'pending'}
                        >
                            <Pause /> Pause
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => updateStatus('ended')}
                            disabled={questData.status === 'ended'}
                        >
                            <StopCircle /> End
                        </Button>
                    </div>
                )}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-muted-foreground mt-2">
                            {questData.description}
                        </p>
                    </div>
                    {isOwner && (
                        <div className="flex items-center gap-2">
                            <Button variant="default" size="sm" asChild>
                                <Link to={`/quests/${questData.id}/edit`}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Quest
                                </Link>
                            </Button>
                            <ShareQuest questId={Number(questData.id)} ownerUserId={Number(questData.user_id)} />
                        </div>
                    )}
                </div>

                {questData.location_name && (
                    <div>Location: {questData.location_name}</div>
                )}

                <div className="mt-8">
                    {mappings && mappings.length > 0 && (
                        <div className="mb-2 text-sm">
                            {(() => {
                                const total = mappings.length;
                                const found = aggregatedProgress?.filter((a) => (a.count || 0) > 0).length || 0;
                                return (
                                    <span className="inline-block bg-emerald-600 text-white px-2 py-0.5 rounded">
                                        {found}/{total} Found
                                    </span>
                                );
                            })()}
                        </div>
                    )}
                    <h2 className="text-xl font-semibold mb-4">
                        Species ({taxa?.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {taxa?.map((taxon) => {
                            const mapping = mappings?.find(
                                (m) => m.taxon_id === taxon.id
                            );
                            const progressCount = mapping
                                ?
                                (aggregatedProgress?.find(
                                    (p) => p.mapping_id === mapping.id
                                )?.count || 0)
                                : 0;
                            const recentEntries = mapping ? detailedProgress?.filter(d => d.mapping_id === mapping.id).slice(0, 3) : [];
                            return (
                                <div key={taxon.id} className="relative">
                                    <SpeciesCardWithObservations
                                        species={taxon}
                                        questData={questData}
                                    />
                                    {(isOwner || token) && mapping && (
                                        <div className="absolute bottom-2 right-2">
                                            <Button
                                                size="sm"
                                                variant="neutral"
                                                disabled={questData.status !== 'active'}
                                                onClick={async () => {
                                                    try {
                                                        let progress;
                                                        if (isOwner) {
                                                            progress = detailedProgress?.find(p => p.display_name === user?.username && p.mapping_id === mapping.id);
                                                        } else if (token) {
                                                            progress = detailedProgress?.find(p => p.display_name === share?.guest_name && p.mapping_id === mapping.id);
                                                        }
                                                        const next = !progress;
                                                        if (isOwner) {
                                                            await api.post(`/quest-sharing/quests/${questData.id}/progress/${mapping.id}`, { observed: next });
                                                        } else if (token) {
                                                            await api.post(`/quest-sharing/shares/token/${token}/progress/${mapping.id}`, { observed: next });
                                                        }
                                                        // toast.success('Progress updated');
                                                        console.log("Progress updated")
                                                    } catch (e) {
                                                        toast.error('Action failed');
                                                    }
                                                }}
                                            >
                                                Found
                                            </Button>
                                        </div>
                                    )}
                                    {progressCount > 0 && (
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-md shadow">
                                                <div>
                                                    Found{progressCount > 1 ? ` x${progressCount}` : ''}
                                                </div>
                                                {mapping && (
                                                    <div className="text-[10px] opacity-90 mt-0.5">
                                                        {(() => {
                                                            const meta = aggregatedProgress?.find(p => p.mapping_id === mapping.id);
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
                                                {recentEntries && recentEntries.length > 0 && (
                                                    <div className="text-[10px] opacity-90 mt-1">
                                                        {recentEntries.map((e) => {
                                                            const d = new Date(e.observed_at);
                                                            return (
                                                                <div key={e.progress_id}>{e.display_name || 'Someone'} • {d.toLocaleString()}</div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};


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
                <h2 className="text-xl font-semibold text-destructive mb-2">
                    Error
                </h2>
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
                    Please select a collection or navigate to a valid collection
                    ID.
                </p>
                <Button variant="default" asChild>
                    <a href="/quests">View All Quests</a>
                </Button>
            </Card>
        </div>
    );
}
