import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { useQuestContext } from '@/features/quests/context/QuestContext'
import { useTaxaWithProgress } from '../../hooks/useTaxaWithProgress'
import { QuestHeader } from './parts/QuestHeader'
import { QuestLeaderboard } from './parts/QuestLeaderboard'
import { TaxaPieChart } from './parts/TaxaPieChart'
import { QuestSpecies } from './parts/QuestSpecies'
import { QuestControls } from './parts/QuestControls'
import { QuestSummaryModal } from '../QuestSummaryModal'
import { ClientQuest } from '../SpeciesCardWithObservations'
import { useAuth } from '@/core/auth/useAuth'
import { useState, useEffect } from 'react'
import { QuestStatusBadge } from '../QuestStatusBadge'

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
            case 'pending':
                return 'bg-gray-50'
            case 'active':
                return 'bg-green-50'
            case 'paused':
                return 'bg-yellow-50'
            case 'ended':
                return 'bg-blue-50'
            default:
                return 'bg-green-50'
        }
    }

    return (
        <div
            className={`min-h-screen ${getStatusBackgroundClass(
                questData.status
            )} transition-colors duration-300`}
        >
            <div className="container mx-auto px-4 py-8">
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
                    />
                )}

                {questData &&
                    (questData?.status === 'paused' ||
                    questData?.status === 'pending' ? (
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full mb-8"
                        >
                            <AccordionItem value="quest-data">
                                <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-2">
                                        <span>
                                            Quest Progress & Leaderboard
                                        </span>
                                        <QuestStatusBadge
                                            status={questData.status}
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 gap-8 items-start">
                                        <div>
                                            {isLeaderboardError ? (
                                                <div className="text-sm text-amber-600 mb-3 bg-amber-50 p-4 rounded-md border border-amber-200">
                                                    ⚠️ Unable to load leaderboard
                                                    data. This may be due to
                                                    rate limiting.
                                                    <button
                                                        onClick={() =>
                                                            window.location.reload()
                                                        }
                                                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            ) : (
                                                <QuestLeaderboard
                                                    leaderboard={leaderboard}
                                                    questStatus={
                                                        questData?.status
                                                    }
                                                    questId={questData?.id}
                                                    ownerUserId={
                                                        questData?.user_id
                                                    }
                                                    questName={questData?.name}
                                                    isOwner={isOwner}
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-center items-start min-h-[300px] pt-4">
                                            {isProgressError || isTaxaError ? (
                                                <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md border border-amber-200 max-w-xs">
                                                    ⚠️ Unable to load progress
                                                    data. This may be due to
                                                    rate limiting.
                                                    <button
                                                        onClick={() =>
                                                            window.location.reload()
                                                        }
                                                        className="block mt-2 text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            ) : mappings &&
                                              mappings.length > 0 ? (
                                                <div className="w-64 h-64">
                                                    {(() => {
                                                        const total =
                                                            mappings.length
                                                        const found =
                                                            aggregatedProgress?.filter(
                                                                (a) =>
                                                                    (a.count ||
                                                                        0) > 0
                                                            ).length || 0
                                                        return (
                                                            <TaxaPieChart
                                                                found={found}
                                                                total={total}
                                                            />
                                                        )
                                                    })()}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ) : (
                        <div className="grid grid-cols-2 gap-8 items-start mb-8">
                            <div>
                                {isLeaderboardError ? (
                                    <div className="text-sm text-amber-600 mb-3 bg-amber-50 p-4 rounded-md border border-amber-200">
                                        ⚠️ Unable to load leaderboard data. This
                                        may be due to rate limiting.
                                        <button
                                            onClick={() =>
                                                window.location.reload()
                                            }
                                            className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
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
                            <div className="flex justify-center items-start min-h-[300px] pt-4">
                                {isProgressError || isTaxaError ? (
                                    <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md border border-amber-200 max-w-xs">
                                        ⚠️ Unable to load progress data. This may
                                        be due to rate limiting.
                                        <button
                                            onClick={() =>
                                                window.location.reload()
                                            }
                                            className="block mt-2 text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : mappings && mappings.length > 0 ? (
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
                                ) : null}
                            </div>
                        </div>
                    ))}

                {questData && (
                    <QuestSpecies
                        taxaWithProgress={taxaWithProgress}
                        questData={
                            {
                                ...questData,
                                user_id: questData.user_id.toString(),
                            } as ClientQuest
                        }
                        isOwner={isOwner}
                        token={token}
                        share={share}
                        detailedProgress={detailedProgress}
                        aggregatedProgress={aggregatedProgress}
                        isTaxaFetchingNextPage={isTaxaFetchingNextPage}
                        taxaHasNextPage={taxaHasNextPage}
                        fetchNextTaxaPage={fetchNextTaxaPage}
                        taxa={taxa}
                        mappings={mappings?.map((m) => ({
                            ...m,
                            created_at:
                                m.created_at || new Date().toISOString(),
                        }))} // Convert TaxonMapping to QuestMapping
                        updateStatus={
                            updateStatus ||
                            (() => {
                                // Fallback function for guests who cannot update quest status
                            })
                        }
                        isTaxaLoading={isTaxaLoading}
                        user={user || undefined}
                    />
                )}

                {canEdit && updateStatus && (
                    <div className="py-4">
                        <QuestControls
                            handleActive={() => updateStatus('active')}
                            status={questData.status}
                            handlePaused={() => updateStatus('paused')}
                            handleEnded={() => updateStatus('ended')}
                        />
                    </div>
                )}

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
