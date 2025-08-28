import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useQuestContext } from '@/contexts/QuestContext'
import { useTaxaWithProgress } from '../../hooks/useTaxaWithProgress'
import { QuestHeader } from './parts/QuestHeader'
import { QuestLeaderboard } from './parts/QuestLeaderboard'
import { TaxaPieChart } from './parts/TaxaPieChart'
import { QuestSpecies } from './parts/QuestSpecies'
import { QuestControls } from './parts/QuestControls'
import { useAuth } from '@/hooks/useAuth'

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
            <QuestHeader
                questData={questData}
                isOwner={isOwner}
                share={share}
            />

            <div className="grid grid-cols-2 justify-between items-start">
                <QuestLeaderboard leaderboard={leaderboard} />

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
                                    <TaxaPieChart found={found} total={total} />
                                )
                            })()}
                        </div>
                    )}
                </div>
            </div>

            <QuestSpecies
                taxaWithProgress={taxaWithProgress}
                questData={questData}
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
                    created_at: m.created_at || new Date().toISOString(),
                }))} // Convert TaxonMapping to QuestMapping
                updateStatus={updateStatus || (() => {})} // Provide fallback for undefined
                isTaxaLoading={isTaxaLoading}
                user={user}
            />

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
