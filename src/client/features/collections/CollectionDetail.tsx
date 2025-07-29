import axios from 'axios'
import { chunk } from 'lodash'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import api from '@/api/api'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { QuestMapView } from '@/features/quests/components/QuestMapView'

type Collection = {
    id: string
    name: string
    description: string
    taxon_ids: number[]
    is_private: boolean
    user_id: string
    created_at: string
    updated_at: string
}

interface CollectionProps {
    collectionId?: string | number
}

export default function CollectionDetail({
    collectionId: propCollectionId,
}: CollectionProps) {
    const routeParams = useParams()
    const urlCollectionId = routeParams.collectionId
    const activeCollectionId = propCollectionId || urlCollectionId
    const [collectionData, setCollectionData] = useState<Collection | null>(
        null
    )
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isError, setIsError] = useState<string | null>(null)
    const [taxa, setTaxa] = useState<unknown[]>([])

    useEffect(() => {
        if (!activeCollectionId) {
            setCollectionData(null)
            setIsLoading(false)
            setIsError(null)
            return
        }

        const fetchCollection = async () => {
            setIsLoading(true)
            setIsError(null)

            try {
                const response = await api.get(
                    `/collections/${activeCollectionId}`
                )
                setCollectionData(response.data)

                if (response.data.taxon_ids?.length) {
                    const taxaIdsChunks = chunk(response.data.taxon_ids, 30)
                    const allTaxaResults: iNatTaxaResult[] = []

                    for (const chunk of taxaIdsChunks) {
                        try {
                            const chunkIds = chunk.join(',')
                            const taxaResponse = await api.get(
                                `/iNatApi/taxa/${chunkIds}`
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
                            // Continue with other chunks even if one fails
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
                setCollectionData(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCollection()
    }, [activeCollectionId])

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError) {
        return <ErrorState error={isError} />
    }

    if (!collectionData) {
        return <EmptyState />
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-card p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-primary">
                                {collectionData.name}
                            </h1>
                            {collectionData.is_private ? (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <LockOpen className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                        <p className="text-muted-foreground mt-2">
                            {collectionData.description}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/collections/${collectionData.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Collection
                        </a>
                    </Button>
                </div>

                <div>Location: {collectionData.location_name}</div>
                <QuestMapView
                    options={{
                        center: [
                            collectionData.latitude,
                            collectionData.longitude,
                        ],
                        zoom: 10,
                    }}
                />
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Species ({taxa.length})
                    </h2>
                    <div className="relative">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {taxa.map((taxon) => (
                                <div
                                    key={taxon.id}
                                    className="transform transition-transform hover:scale-105"
                                >
                                    <SpeciesCard species={taxon} />
                                </div>
                            ))}
                        </div>
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
                <h2 className="text-xl font-semibold mb-2">
                    No Collection Found
                </h2>
                <p className="text-muted-foreground mb-4">
                    Please select a collection or navigate to a valid collection
                    ID.
                </p>
                <Button variant="outline" asChild>
                    <a href="/collections">View All Collections</a>
                </Button>
            </Card>
        </div>
    )
}
