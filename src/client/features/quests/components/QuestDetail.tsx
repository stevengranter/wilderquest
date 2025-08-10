import { INatTaxon } from '@shared/types/iNatTypes'
import axios from 'axios'
import { chunk } from 'lodash'
import { Lock, LockOpen, Pause, Pencil, Play, StopCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import ShareQuest from '@/features/quests/components/ShareQuest'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

type Quest = {
    id: string
    name: string
    description?: string
    taxon_ids?: number[]
    is_private: boolean
    user_id: string
    created_at: string
    updated_at: string
    location_name?: string
    latitude?: number
    longitude?: number
    status: 'pending' | 'active' | 'paused' | 'ended'
}

interface QuestProps {
    questId?: string | number
}

export default function QuestDetail({ questId: propQuestId }: QuestProps) {
    const routeParams = useParams()
    const urlQuestId = routeParams.questId
    const activeQuestId = propQuestId || urlQuestId
    const [questData, setQuestData] = useState<Quest | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const { user } = useAuth()
    const isOwner = !!user && questData && Number(user.id) === Number(questData.user_id)
    const [taxaMappings, setTaxaMappings] = useState<{
        id: number
        quest_id: number
        taxon_id: number
    }[]>([])
    const [aggregatedProgress, setAggregatedProgress] = useState<
        { mapping_id: number; count: number; last_observed_at?: string; last_display_name?: string | null }[]
    >([])
    const [detailedProgress, setDetailedProgress] = useState<
        { progress_id: number; mapping_id: number; observed_at: string; quest_share_id: number; display_name?: string | null }[]
    >([])

    const fetchQuest = async () => {
        setIsLoading(true)
        setIsError(null)

        try {
            const response = await api.get(`/quests/${activeQuestId}`)
            setQuestData(response.data)

            if (response.data.taxon_ids?.length) {
                const taxaIdsChunks = chunk(response.data.taxon_ids, 30)
                const allTaxaResults: INatTaxon[] = []

                for (const chunk of taxaIdsChunks) {
                    try {
                        const chunkIds = chunk.join(',')
                        const taxaResponse = await api.get(
                            `/iNatAPI/taxa/${chunkIds}`
                        )

                        if (taxaResponse.data.results) {
                            allTaxaResults.push(
                                ...taxaResponse.data.results
                            )
                        }
                    } catch (chunkError) {
                        console.error(
                            'Error fetching taxa chunk:',
                            chunkError
                        )
                    }
                }

                setTaxa(allTaxaResults)
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setIsError(err.response?.data?.message || err.message)
            } else {
                setIsError('An unexpected error occurred.')
            }
            setQuestData(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!activeQuestId) {
            setQuestData(null)
            setIsLoading(false)
            setIsError(null)
            return
        }

        fetchQuest()
    }, [activeQuestId])

    const fetchMappingsAndProgress = useCallback(async () => {
        try {
            const questIdNum = Number(activeQuestId)
            if (!questIdNum) return

            const [mappingsRes, progressRes, detailedRes] = await Promise.all([
                api.get(`/quest-sharing/quests/${questIdNum}/mappings`),
                api.get(`/quest-sharing/quests/${questIdNum}/progress/aggregate`),
                api.get(`/quest-sharing/quests/${questIdNum}/progress/detailed`),
            ])
            setTaxaMappings(mappingsRes.data || [])
            setAggregatedProgress(progressRes.data || [])
            setDetailedProgress(detailedRes.data || [])
        } catch (err) {
            // ignore
        }
    }, [activeQuestId]);

    // Poll aggregated progress so QuestDetail updates in near real-time
    useEffect(() => {
        fetchMappingsAndProgress()
        const timer = window.setInterval(fetchMappingsAndProgress, 5000)
        return () => {
            if (timer) window.clearInterval(timer)
        }
    }, [activeQuestId, fetchMappingsAndProgress])

    useEffect(() => {
        if (!activeQuestId) return;

        const eventSource = new EventSource(`/api/quests/${activeQuestId}/events`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'QUEST_STATUS_UPDATED') {
                toast.info(`Quest status updated to ${data.payload.status}`);
                setQuestData(prev => prev ? { ...prev, status: data.payload.status } : null);
            } else if (data.type === 'SPECIES_FOUND') {
                const guestName = data.payload.guestName || (data.payload.owner ? 'The owner' : 'A guest');
                toast.success(`${guestName} found a species!`);
                fetchMappingsAndProgress();
            } else if (data.type === 'SPECIES_UNFOUND') {
                const guestName = data.payload.guestName || (data.payload.owner ? 'The owner' : 'A guest');
                toast.info(`${guestName} unmarked a species.`);
                fetchMappingsAndProgress();
            }
        };

        return () => {
            eventSource.close();
        };
    }, [activeQuestId, fetchMappingsAndProgress]);

    const updateStatus = async (status: 'pending' |'active' | 'paused' | 'ended') => {
        if (!questData) return;
        try {
            await api.patch(`/quests/${questData.id}/status`, { status });
            setQuestData(prev => prev ? { ...prev, status } : null);
            // toast.success(`Quest status updated to ${status}`);
        } catch (error) {
            // toast.error('Failed to update quest status');
        }
    };

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError) {
        return <ErrorState error={isError} />
    }

    if (!questData) {
        return <EmptyState />
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
                    <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" asChild>
                            <Link to={`/quests/${questData.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Quest
                            </Link>
                        </Button>
                        <ShareQuest questId={Number(questData.id)} ownerUserId={Number(questData.user_id)} />
                    </div>
                </div>

                {questData.location_name && (
                    <div>Location: {questData.location_name}</div>
                )}

                <div className="mt-8">
                    {taxaMappings.length > 0 && (
                        <div className="mb-2 text-sm">
                            {(() => {
                                const total = taxaMappings.length
                                const found = aggregatedProgress.filter((a) => (a.count || 0) > 0).length
                                return (
                                    <span className="inline-block bg-emerald-600 text-white px-2 py-0.5 rounded">
                                        {found}/{total} Found
                                    </span>
                                )
                            })()}
                        </div>
                    )}
                    <h2 className="text-xl font-semibold mb-4">
                        Species ({taxa.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {taxa.map((taxon) => {
                            const mapping = taxaMappings.find(
                                (m) => m.taxon_id === taxon.id
                            )
                            const progressCount = mapping
                                ?
                                (aggregatedProgress.find(
                                    (p) => p.mapping_id === mapping.id
                                )?.count || 0)
                                : 0
                            const recentEntries = mapping ? detailedProgress.filter(d => d.mapping_id === mapping.id).slice(0, 3) : []
                            return (
                                <div key={taxon.id} className="relative">
                                    <SpeciesCardWithObservations
                                        species={taxon}
                                        questData={questData}
                                    />
                                    {isOwner && mapping && (
                                        <div className="absolute bottom-2 right-2">
                                            <Button
                                                size="sm"
                                                variant="neutral"
                                                onClick={async () => {
                                                    try {
                                                        const ownerProgress = detailedProgress.find(p => p.display_name === user?.username && p.mapping_id === mapping.id);
                                                        const next = !ownerProgress;
                                                        await api.post(`/quest-sharing/quests/${questData.id}/progress/${mapping.id}`, { observed: next })
                                                        // After toggling, refresh aggregates to determine who/first
                                                        const aggRes = await api.get(`/quest-sharing/quests/${questData.id}/progress/aggregate`)
                                                        setAggregatedProgress(aggRes.data || [])
                                                        const detailedRes = await api.get(`/quest-sharing/quests/${questData.id}/progress/detailed`)
                                                        setDetailedProgress(detailedRes.data || [])
                                                        const meta = (aggRes.data as Array<{ mapping_id: number; count: number; last_display_name?: string }> ).find(p => p.mapping_id === mapping.id)
                                                        const name = meta?.last_display_name || (user?.username ?? 'You')
                                                        if (next) {
                                                            const first = (meta?.count || 0) === 1
                                                            // toast(first ? `First found by ${name}` : `Found by ${name}`)
                                                        } else {
                                                            // toast(`Unmarked by ${name}`)
                                                        }
                                                    } catch (e) {
                                                        toast('Action failed')
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
                                                            const meta = aggregatedProgress.find(p => p.mapping_id === mapping.id)
                                                            if (!meta) return null
                                                            const ts = meta.last_observed_at
                                                            const name = (meta as any).last_display_name || 'Someone'
                                                            try {
                                                                const d = ts ? new Date(ts) : null
                                                                const formatted = d ? d.toLocaleString() : ''
                                                                return `${name} • ${formatted}`
                                                            } catch {
                                                                return name
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                                {recentEntries.length > 0 && (
                                                    <div className="text-[10px] opacity-90 mt-1">
                                                        {recentEntries.map((e) => {
                                                            const d = new Date(e.observed_at)
                                                            return (
                                                                <div key={e.progress_id}>{e.display_name || 'Someone'} • {d.toLocaleString()}</div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Card>
        </div>
    )
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
    )
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
    )
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
    )
}
