import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

import { useQuestContext } from '@/features/quests/context/QuestContext'
import { useTaxaWithProgress } from '../../hooks/useTaxaWithProgress'
import { QuestHeader } from './parts/QuestHeader'
import { QuestLeaderboard } from './parts/QuestLeaderboard'
import { TaxaPieChart } from './parts/TaxaPieChart'
import { QuestSpecies } from './parts/QuestSpecies'

import { QuestSummaryModal } from '../QuestSummaryModal'
import { ClientQuest } from '../SpeciesCardWithObservations'
import { ShareQuest } from '../ShareQuest'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { QuestStatusBadge } from '../QuestStatusBadge'
import { Grid, List, Map as MapIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export const QuestView = () => {
    const { user } = useAuth()
    const {
        questData,
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress,
        leaderboard,
        share,
        token,
        isLoading,
        isTaxaLoading,
        isTaxaFetchingNextPage,
        taxaHasNextPage,
        fetchNextTaxaPage,
        isError,
        isProgressError,
        isLeaderboardError,
        isTaxaError,
        updateStatus,
        isOwner,
        canEdit,
    } = useQuestContext()

    const taxaWithProgress = useTaxaWithProgress(
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress
    )

    // State for quest summary modal
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [prevQuestStatus, setPrevQuestStatus] = useState<string | undefined>()
    const [showInviteDrawer, setShowInviteDrawer] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
    const [explorersExpanded, setExplorersExpanded] = useState(false)

    // Show summary modal when quest ends (only for quest owner)
    useEffect(() => {
        if (
            questData?.status === 'ended' &&
            prevQuestStatus !== 'ended' &&
            isOwner
        ) {
            setShowSummaryModal(true)
        }
        setPrevQuestStatus(questData?.status)
    }, [questData?.status, prevQuestStatus, isOwner])

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError) {
        return <ErrorState error="Failed to load quest data." />
    }

    if (!questData) {
        return <EmptyState />
    }

    const getStatusBackgroundClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'relative before:fixed before:inset-0 before:bg-green-200 before:animate-pulse before:duration-2000 before:-z-10'
            default:
                return ''
        }
    }

    return (
        <div
            className={`min-h-screen ${getStatusBackgroundClass(questData.status)} transition-colors duration-300`}
        >
            <div className="container mx-auto px-4 relative z-10">
                {questData && (
                    <QuestHeader
                        questData={
                            {
                                ...questData,
                                user_id: questData.user_id.toString(),
                            } as ClientQuest
                        }
                        isOwner={isOwner}
                        share={share}
                        mappings={mappings}
                        aggregatedProgress={aggregatedProgress}
                        isProgressError={isProgressError}
                        isTaxaError={isTaxaError}
                        canEdit={canEdit}
                        updateStatus={updateStatus}
                    />
                )}

                <div className="mb-8">
                    {/* Quest Explorers - appears first on small screens */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                Explorers
                                <Badge
                                    variant="neutral"
                                    className="border border-gray-300 font-semibold"
                                >
                                    {leaderboard?.length || 0}
                                </Badge>
                            </h2>
                            {questData?.id && questData?.user_id && isOwner && (
                                <ShareQuest
                                    questId={questData.id}
                                    questName={questData.name}
                                    ownerUserId={questData.user_id}
                                    showForm={showInviteDrawer}
                                    onToggleForm={setShowInviteDrawer}
                                    showDrawerOnly={false}
                                />
                            )}
                        </div>
                        {showInviteDrawer &&
                            questData?.id &&
                            questData?.user_id &&
                            isOwner && (
                                <div className="pb-6">
                                    <ShareQuest
                                        questId={questData.id}
                                        questName={questData.name}
                                        ownerUserId={questData.user_id}
                                        showForm={showInviteDrawer}
                                        onToggleForm={setShowInviteDrawer}
                                        showDrawerOnly={true}
                                    />
                                </div>
                            )}
                        <div className="px-0 pb-6">
                            {isLeaderboardError ? (
                                <div className="text-sm text-amber-600 mb-3 bg-amber-50 p-4 rounded-md border border-amber-200">
                                    ⚠️ Unable to load leaderboard data. This may
                                    be due to rate limiting.
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : leaderboard && leaderboard.length > 3 ? (
                                <Accordion
                                    type="single"
                                    collapsible
                                    value={explorersExpanded ? 'explorers' : ''}
                                    onValueChange={(value) =>
                                        setExplorersExpanded(
                                            value === 'explorers'
                                        )
                                    }
                                    className="shadow-0"
                                >
                                    <AccordionItem
                                        value="explorers"
                                        className="border-1 shadow-0"
                                    >
                                        <AccordionTrigger className="shadow-0 bg-background">
                                            Show all {leaderboard.length}{' '}
                                            explorers
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-0 shadow-0">
                                            <QuestLeaderboard
                                                leaderboard={leaderboard}
                                                questStatus={questData?.status}
                                                questId={questData?.id}
                                                ownerUserId={questData?.user_id}
                                                questName={questData?.name}
                                                isOwner={isOwner}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ) : (
                                <QuestLeaderboard
                                    leaderboard={leaderboard}
                                    questStatus={questData?.status}
                                    questId={questData?.id}
                                    ownerUserId={questData?.user_id}
                                    questName={questData?.name}
                                    isOwner={isOwner}
                                />
                            )}
                        </div>
                    </div>

                    {/* Species Cards - appears second on small screens */}
                    <div>
                        <div className="flex items-center justify-between mb-6 ">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                Species
                                <Badge
                                    variant="neutral"
                                    className="border border-gray-300 font-semibold"
                                >
                                    {mappings?.length || 0}
                                </Badge>
                            </h2>
                            <ToggleGroup
                                type="single"
                                value={viewMode}
                                onValueChange={(
                                    value: 'grid' | 'list' | 'map'
                                ) => value && setViewMode(value)}
                                className="border-0 rounded-lg"
                            >
                                <ToggleGroupItem
                                    value="grid"
                                    aria-label="Grid view"
                                >
                                    <Grid className="h-4 w-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="list"
                                    aria-label="List view"
                                >
                                    <List className="h-4 w-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="map"
                                    aria-label="Map view"
                                >
                                    <MapIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div className="-mt-1">
                            {questData && (
                                <QuestSpecies
                                    taxaWithProgress={taxaWithProgress}
                                    questData={
                                        {
                                            ...questData,
                                            user_id:
                                                questData.user_id.toString(),
                                        } as ClientQuest
                                    }
                                    isOwner={isOwner}
                                    token={token}
                                    share={share}
                                    detailedProgress={detailedProgress}
                                    aggregatedProgress={aggregatedProgress}
                                    isTaxaFetchingNextPage={
                                        isTaxaFetchingNextPage
                                    }
                                    taxaHasNextPage={taxaHasNextPage}
                                    fetchNextTaxaPage={fetchNextTaxaPage}
                                    taxa={taxa}
                                    mappings={mappings?.map((m) => ({
                                        ...m,
                                        created_at:
                                            m.created_at ||
                                            new Date().toISOString(),
                                    }))} // Convert TaxonMapping to QuestMapping
                                    updateStatus={
                                        updateStatus ||
                                        (() => {
                                            // Fallback function for guests who cannot update quest status
                                        })
                                    }
                                    isTaxaLoading={isTaxaLoading}
                                    user={user || undefined}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Quest Summary Modal */}
                <QuestSummaryModal
                    isOpen={showSummaryModal}
                    onClose={() => setShowSummaryModal(false)}
                    questData={questData}
                    leaderboard={leaderboard || []}
                    taxaWithProgress={taxaWithProgress}
                    totalParticipants={leaderboard?.length || 0}
                />
            </div>
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
