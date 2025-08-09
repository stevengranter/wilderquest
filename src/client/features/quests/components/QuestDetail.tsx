import { INatTaxon } from '@shared/types/iNatTypes'
import axios from 'axios'
import { chunk } from 'lodash'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import ShareQuest from '@/features/quests/components/ShareQuest'

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
    const [taxaMappings, setTaxaMappings] = useState<{
        id: number
        quest_id: number
        taxon_id: number
    }[]>([])
    const [aggregatedProgress, setAggregatedProgress] = useState<
        { mapping_id: number; count: number }[]
    >([])

    useEffect(() => {
        if (!activeQuestId) {
            setQuestData(null)
            setIsLoading(false)
            setIsError(null)
            return
        }

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

        fetchQuest()
    }, [activeQuestId])

    // Poll aggregated progress so QuestDetail updates in near real-time
    useEffect(() => {
        let timer: number | undefined
        const questIdNum = Number(activeQuestId)
        if (!questIdNum) return

        const fetchMappingsAndProgress = async () => {
            try {
                const [mappingsRes, progressRes] = await Promise.all([
                    api.get(`/quest-sharing/quests/${questIdNum}/mappings`),
                    api.get(
                        `/quest-sharing/quests/${questIdNum}/progress/aggregate`
                    ),
                ])
                setTaxaMappings(mappingsRes.data || [])
                setAggregatedProgress(progressRes.data || [])
            } catch (err) {
                // ignore
            }
        }

        fetchMappingsAndProgress()
        timer = window.setInterval(fetchMappingsAndProgress, 5000)
        return () => {
            if (timer) window.clearInterval(timer)
        }
    }, [activeQuestId])

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
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-primary">
                                {questData.name}
                            </h1>
                            {questData.is_private ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <LockOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
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
                            return (
                                <div key={taxon.id} className="relative">
                                    <SpeciesCardWithObservations
                                        species={taxon}
                                        questData={questData}
                                    />
                                    {progressCount > 0 && (
                                        <div className="absolute top-2 right-2">
                                            <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-md">
                                                Found{progressCount > 1 ? ` x${progressCount}` : ''}
                                            </span>
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
