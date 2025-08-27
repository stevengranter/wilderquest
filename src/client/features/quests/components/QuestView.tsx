import { INatTaxon } from '@shared/types/iNatTypes'
import { isSameDay, isSameYear } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { AnimatePresence, motion } from 'motion/react'
import { Grid, List, Lock, LockOpen, Map, Pause, Pencil, Play, StopCircle } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import api from '@/api/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import ShareQuest from '@/features/quests/components/ShareQuest'
import { ClientQuest, SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import {
    AggregatedProgress,
    DetailedProgress,
    LeaderboardEntry,
    QuestMapping,
    QuestStatus as QuestStatusType,
    Share,
} from '@/features/quests/types'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import { QuestMapView } from './QuestMapView'
import { QuestListView } from './QuestListView'

type QuestViewProps = {
    questData: ClientQuest | null | undefined
    taxa: INatTaxon[] | undefined
    mappings: QuestMapping[] | undefined
    aggregatedProgress: AggregatedProgress[] | undefined
    detailedProgress: DetailedProgress[] | undefined
    isLoading: boolean
    isTaxaLoading: boolean
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    fetchNextTaxaPage: () => void
    isError: boolean
    updateStatus: (status: QuestStatusType) => void
    isOwner: boolean
    token?: string
    share?: Share
    leaderboard?: LeaderboardEntry[]
}

function QuestTimestamps({
                             startsAt,
                             endsAt,
                         }: {
    startsAt?: Date
    endsAt?: Date
}) {
    if (!startsAt) return null

    const now = new Date()
    const start = new Date(startsAt)
    const end = endsAt ? new Date(endsAt) : null

    // Auto-detect user's timezone or set a default
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const isActive = start <= now && (!end || end >= now)
    const hasEnded = end && end < now
    const isUpcoming = start > now

    const getDisplayText = () => {
        if (isUpcoming) {
            const days = Math.ceil(
                (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            return `Starts in ${days} day${days !== 1 ? 's' : ''}`
        }
        if (hasEnded) return 'Ended'
        if (end) {
            const days = Math.ceil(
                (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            return `${days} day${days !== 1 ? 's' : ''} left`
        }
        return 'Active'
    }

    const formatCompactDateTime = () => {
        const includeStartYear = !isSameYear(start, now)
        const includeEndYear = end && !isSameYear(end, now)

        if (!end) {
            // Just start time
            const dateFormat = includeStartYear
                ? 'MMM d, yyyy, h:mm a (zzz)'
                : 'MMM d, h:mm a (zzz)'
            return formatInTimeZone(start, timeZone, dateFormat)
        }

        const isSameDayResult = isSameDay(start, end)

        if (isSameDayResult) {
            // Same day
            const dateFormat = includeStartYear ? 'MMM d, yyyy' : 'MMM d'
            const dateStr = formatInTimeZone(start, timeZone, dateFormat)
            const startTime = formatInTimeZone(start, timeZone, 'h:mm a')
            const endTime = formatInTimeZone(end, timeZone, 'h:mm a')
            const timezone = formatInTimeZone(end, timeZone, '(zzz)')

            return `${dateStr}, ${startTime} - ${endTime} ${timezone}`
        } else {
            // Different days
            const startFormat = includeStartYear
                ? 'MMM d, yyyy, h:mm a'
                : 'MMM d, h:mm a'
            const endFormat = includeEndYear
                ? 'MMM d, yyyy, h:mm a'
                : 'MMM d, h:mm a'

            const startStr = formatInTimeZone(start, timeZone, startFormat)
            const endStr = formatInTimeZone(end, timeZone, endFormat)
            const timezone = formatInTimeZone(end, timeZone, '(zzz)')

            return `${startStr} - ${endStr} ${timezone}`
        }
    }

    return (
        <div className="flex items-center gap-3">
            {/* Compact Status Badge */}
            <div
                className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${
                    isActive
                        ? 'bg-green-100 text-green-800'
                        : hasEnded
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-800'
                }
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
    )
}

const TaxaPieChart = ({ found, total }: { found: number; total: number }) => {
    const data = [
        { name: 'Found', value: found },
        { name: 'Not Found', value: total - found },
    ]
    const COLORS = ['#4ade80', '#f1f5f9'] // green-400, gray-200
    const isComplete = found === total

    return (
        <div className="w-full h-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        fill="#8884d8"
                        paddingAngle={isComplete ? 0 : 5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-5xl font-bold">{found}</div>
                <div className="text-xl text-muted-foreground">of {total}</div>
            </div>
        </div>
    )
}

export const QuestView = ({
                              questData,
                              taxa,
                              mappings,
                              aggregatedProgress,
                              detailedProgress,
                              isLoading,
                              isTaxaLoading,
                              isTaxaFetchingNextPage,
                              taxaHasNextPage,
                              fetchNextTaxaPage,
                              isError,
                              updateStatus,
                              isOwner,
                              token,
                              share,
                              leaderboard,
                          }: QuestViewProps) => {
    const { user } = useAuth()
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')

    const observer = useRef<IntersectionObserver | null>(null)
    const lastTaxonElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isTaxaFetchingNextPage) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && taxaHasNextPage) {
                    fetchNextTaxaPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isTaxaFetchingNextPage, taxaHasNextPage, fetchNextTaxaPage]
    )

    const taxaWithProgress = useMemo(() => {
        if (!taxa) return []

        const enrichedTaxa = taxa.map((taxon) => {
            const mapping = mappings?.find((m) => m.taxon_id === taxon.id)
            const progressCount =
                mapping?.id && aggregatedProgress
                    ? aggregatedProgress.find(
                    (p) => p.mapping_id === mapping.id
                )?.count || 0
                    : 0
            const recentEntries =
                mapping?.id && detailedProgress
                    ? detailedProgress
                        .filter((d) => d.mapping_id === mapping.id)
                        .slice(0, 3)
                    : []
            return {
                ...taxon,
                mapping,
                progressCount,
                recentEntries,
                isFound: progressCount > 0
            }
        })

        // Create stable groups instead of sorting
        const notFound = enrichedTaxa.filter(taxon => !taxon.isFound)
        const found = enrichedTaxa.filter(taxon => taxon.isFound)

        return [...notFound, ...found]
    }, [taxa, mappings, aggregatedProgress, detailedProgress])

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError) {
        return <ErrorState error="Failed to load quest data." />
    }

    if (!questData) {
        return <EmptyState />
    }

    return (
        <div className="container mx-auto px-4 py-8">
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

            <div className="grid grid-cols-2 justify-between items-start">
                {/* Leaderboard */}
                <div className="mt-8 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
                    {leaderboard && leaderboard.length > 0 ? (
                        <div className="space-y-2">
                            <AnimatePresence>
                                {leaderboard.map(
                                    (entry: LeaderboardEntry, index: number) => (
                                        <motion.div
                                            key={entry.display_name || index}
                                            // layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex justify-between items-center p-2 bg-gray-100 rounded-md"
                                        >
                                            <span className="font-medium">
                                                {index + 1}.{' '}
                                                {entry.display_name ||
                                                    'Anonymous'}
                                            </span>
                                            <span className="text-sm">
                                                {entry.observation_count} taxa
                                                found
                                            </span>
                                        </motion.div>
                                    )
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-left text-muted-foreground py-4">
                            No participants have joined yet.
                        </div>
                    )}
                </div>

                {/* n/total taxa found */}
                <div className="flex justify-center items-center">
                    {mappings && mappings.length > 0 && (
                        <div className="w-64 h-64">
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
                                    />
                                )
                            })()}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8">

                {/* View Mode Controls */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        Species ({taxa?.length ?? '...'})
                    </h2>
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value: 'grid' | 'list' | 'map') =>
                            value && setViewMode(value)
                        }
                        className="border-0 rounded-lg"
                    >
                        <ToggleGroupItem value="grid" aria-label="Grid view">
                            <Grid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="map" aria-label="Map view">
                            <Map className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* View Content */}
                {viewMode === 'grid' && (
                    <div className="space-y-8">
                        {/* Not Found Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">
                                Not Found ({taxaWithProgress.filter(t => !t.isFound).length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6 auto-rows-fr">
                                <AnimatePresence mode="popLayout">
                                {taxaWithProgress
                                    .filter(t => !t.isFound)
                                    .map((taxon, index, arr) => {
                                        const isLastElement = index === arr.length - 1
                                        return (

                                            <motion.div
                                                key={taxon.id}
                                                ref={index === arr.length - 1 ? lastTaxonElementRef : null}
                                                className="relative"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <SpeciesCardWithObservations
                                                    species={taxon}
                                                    questData={questData}
                                                    found={taxon.progressCount > 0}
                                                    actionArea={

                                                        (isOwner || token) && taxon.mapping && (
                                                            <div className="p-2">
                                                                <Button
                                                                    className="w-full shadow-0 border-1"
                                                                    size="sm"
                                                                    variant="neutral"
                                                                    disabled={questData.status !== 'active'}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        if (!taxon.mapping) return // ✅ safety
                                                                        try {
                                                                            let progress
                                                                            if (isOwner) {
                                                                                progress = detailedProgress?.find(
                                                                                    (p) =>
                                                                                        p.display_name === user?.username &&
                                                                                        p.mapping_id === taxon.mapping!.id
                                                                                )
                                                                            } else if (token) {
                                                                                progress = detailedProgress?.find(
                                                                                    (p) =>
                                                                                        p.display_name === share?.guest_name &&
                                                                                        p.mapping_id === taxon.mapping!.id
                                                                                )
                                                                            }
                                                                            const next = !progress
                                                                            if (isOwner) {
                                                                                await api.post(
                                                                                    `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping!.id}`,
                                                                                    { observed: next }
                                                                                )
                                                                            } else if (token) {
                                                                                await api.post(
                                                                                    `/quest-sharing/shares/token/${token}/progress/${taxon.mapping!.id}`,
                                                                                    { observed: next }
                                                                                )
                                                                            }
                                                                            console.log('Progress updated')
                                                                        } catch (_e) {
                                                                            toast.error('Action failed')
                                                                        }
                                                                    }}
                                                                >
                                                                    Found
                                                                </Button>
                                                            </div>
                                                        )
                                                    }
                                                />
                                            </motion.div>

                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Found Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">
                                Found ({taxaWithProgress.filter(t => t.isFound).length})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6 auto-rows-fr">
                                {taxaWithProgress
                                    .filter(t => t.isFound)
                                    .map((taxon) => (
                                        <div key={taxon.id} className="relative">
                                            <SpeciesCardWithObservations
                                                species={taxon}
                                                questData={questData}
                                                found={taxon.progressCount > 0}
                                                actionArea={
                                                    (isOwner || token) && taxon.mapping && (
                                                        <div className="p-2">
                                                            <Button
                                                                className="w-full shadow-0 border-1"
                                                                size="sm"
                                                                variant="neutral"
                                                                disabled={questData.status !== 'active'}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    if (!taxon.mapping) return
                                                                    try {
                                                                        let progress
                                                                        if (isOwner) {
                                                                            progress = detailedProgress?.find(
                                                                                (p) =>
                                                                                    p.display_name === user?.username &&
                                                                                    p.mapping_id === taxon.mapping!.id
                                                                            )
                                                                        } else if (token) {
                                                                            progress = detailedProgress?.find(
                                                                                (p) =>
                                                                                    p.display_name === share?.guest_name &&
                                                                                    p.mapping_id === taxon.mapping!.id
                                                                            )
                                                                        }
                                                                        const next = !progress
                                                                        if (isOwner) {
                                                                            await api.post(
                                                                                `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping!.id}`,
                                                                                { observed: next }
                                                                            )
                                                                        } else if (token) {
                                                                            await api.post(
                                                                                `/quest-sharing/shares/token/${token}/progress/${taxon.mapping!.id}`,
                                                                                { observed: next }
                                                                            )
                                                                        }
                                                                        console.log('Progress updated')
                                                                    } catch (_e) {
                                                                        toast.error('Action failed')
                                                                    }
                                                                }}
                                                            >
                                                                Found
                                                            </Button>
                                                        </div>
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}


                {viewMode === 'list' && (
                    <QuestListView
                        taxaWithProgress={taxaWithProgress}
                        questData={questData}
                        isOwner={isOwner}
                        token={token}
                        share={share}
                        user={user}
                        detailedProgress={detailedProgress}
                        aggregatedProgress={aggregatedProgress}
                        updateStatus={updateStatus}
                    />
                )}

                {viewMode === 'map' && taxa && mappings && (
                    <QuestMapView
                        className="h-96 w-full rounded-lg border"
                        questData={questData}
                        taxa={taxa}
                        mappings={mappings}
                    />
                )}
            </div>
            {isOwner && (
                <div className="py-4">
                    <QuestControls
                        handleActive={() => updateStatus('active')}
                        status={questData.status}
                        handlePaused={() => updateStatus('paused')}
                        handleEnded={() => updateStatus('ended')}
                    />
                </div>
            )}
        </div>
    )
}

function QuestControls(props: {
    handleActive: () => void
    status: QuestStatusType
    handlePaused: () => void
    handleEnded: () => void
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
    )
}

function _QuestStatus(props: { status: QuestStatusType }) {
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