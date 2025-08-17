import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import api from '@/api/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { INatTaxon } from '../../../../shared/types/iNatTypes'
import { QuestWithTaxa } from '../../../../types/types'

interface QuestCardProps {
    quest: QuestWithTaxa
    photo?: string
}

function QuestCard({ quest, photo }: QuestCardProps) {
    return (
        <Link to={`/quests/${quest.id}`} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden p-0">
                {photo && (
                    <div className="h-48 overflow-hidden">
                        <img
                            src={photo}
                            alt={`Photo from ${quest.name}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <CardHeader className="px-6 pt-4 pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                                {quest.name}
                            </CardTitle>
                        </div>
                        {quest.is_private && (
                            <Badge variant="neutral" className="ml-2">
                                Private
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                {quest.description && (
                    <CardContent className="px-6 pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {quest.description}
                        </p>
                    </CardContent>
                )}
                <CardFooter className="px-6 pb-4 pt-2 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <Badge
                            variant={
                                quest.status === 'active'
                                    ? 'default'
                                    : 'neutral'
                            }
                            className="text-xs"
                        >
                            {quest.status === 'active'
                                ? '🟢'
                                : quest.status === 'paused'
                                  ? '⏸️'
                                  : '🏁'}{' '}
                            {quest.status}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        {quest.taxon_ids && quest.taxon_ids.length > 0 && (
                            <Badge variant="neutral" className="text-xs">
                                {quest.taxon_ids.length} species
                            </Badge>
                        )}
                        {quest.status === 'ended' && (
                            <Badge variant="neutral" className="text-xs">
                                0 found
                            </Badge>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}

export function QuestsPage() {
    const { isAuthenticated, user } = useAuth()

    const [quests, setQuests] = useState<QuestWithTaxa[]>([])
    const [isMyQuests, setIsMyQuests] = useState<boolean>(false)

    function handleChange() {
        setIsMyQuests(!isMyQuests)
    }

    useEffect(() => {
        if (!isMyQuests) {
            api.get('/quests').then((response) => {
                setQuests(response.data)
            })
            return
        }

        if (!isAuthenticated || !user) {
            toast.error('You are not logged in!')
            return
        }

        api.get(`/quests/user/${user.id}`).then((response) => {
            setQuests(response.data)
        })
    }, [isMyQuests, isAuthenticated, user])

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Quests</h1>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="airplane-mode"
                            checked={isMyQuests}
                            onCheckedChange={handleChange}
                        />
                        <Label htmlFor="airplane-mode">My Quests</Label>
                    </div>
                    <Button>
                        <Link to="/quests/create">Create Quest</Link>
                    </Button>
                </div>
            </div>
            <QuestsList quests={quests} />
        </div>
    )
}

function QuestsList({ quests }: { quests: QuestWithTaxa[] }) {
    const [questPhotos, setQuestPhotos] = useState<Map<number, string>>(
        new Map()
    )
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)

    // Fetch photos for all quests in batched requests
    useEffect(() => {
        const fetchPhotos = async () => {
            if (quests.length === 0) return

            setIsLoadingPhotos(true)
            const photoMap = new Map<number, string>()

            // First, collect all taxon IDs from all quests
            const questTaxonMap = new Map<number, number[]>() // questId -> taxonIds
            const allTaxonIds = new Set<number>()

            // Collect taxon IDs from all quests
            for (const quest of quests) {
                let taxonIds = quest.taxon_ids || []

                // If no taxon_ids, try to fetch them from the individual quest endpoint
                if (taxonIds.length === 0) {
                    try {
                        const questResponse = await api.get(
                            `/quests/${quest.id}`
                        )
                        taxonIds = questResponse.data.taxon_ids || []
                    } catch (error) {
                        console.warn(
                            `Could not fetch quest details for ${quest.id}:`,
                            error
                        )
                        continue
                    }
                }

                if (taxonIds && taxonIds.length > 0) {
                    // Take first 3 taxon IDs per quest for representative photos
                    const selectedIds = taxonIds.slice(0, 3)
                    questTaxonMap.set(quest.id, selectedIds)
                    selectedIds.forEach((id) => allTaxonIds.add(id))
                }
            }

            // Batch all unique taxon IDs into chunks of 20 (iNaturalist's limit)
            const uniqueTaxonIds = Array.from(allTaxonIds)
            const chunks = []
            for (let i = 0; i < uniqueTaxonIds.length; i += 20) {
                chunks.push(uniqueTaxonIds.slice(i, i + 20))
            }

            // Fetch all taxa in batched requests with delay to respect rate limits
            const allTaxa = new Map<number, INatTaxon>() // taxonId -> taxon data

            for (let i = 0; i < chunks.length; i++) {
                try {
                    // Add a small delay between requests to be respectful to the API
                    if (i > 0) {
                        await new Promise((resolve) => setTimeout(resolve, 100))
                    }

                    const response = await api.get(
                        `/iNatAPI/taxa/${chunks[i].join(',')}`
                    )
                    const taxa: INatTaxon[] = response.data.results || []
                    taxa.forEach((taxon) => {
                        allTaxa.set(taxon.id, taxon)
                    })
                } catch (error) {
                    console.warn(
                        `Could not fetch taxa chunk ${i + 1}/${chunks.length}:`,
                        error
                    )
                    // If we get a rate limit error, wait longer before continuing
                    if (error.response?.status === 429) {
                        console.warn(
                            'Rate limited, waiting 2 seconds before continuing...'
                        )
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        )
                    }
                }
            }

            // Now assign photos to quests based on their taxon IDs
            for (const [questId, taxonIds] of questTaxonMap) {
                // Find the first taxon with a photo for this quest
                for (const taxonId of taxonIds) {
                    const taxon = allTaxa.get(taxonId)
                    if (taxon?.default_photo?.medium_url) {
                        photoMap.set(questId, taxon.default_photo.medium_url)
                        break // Use the first photo we find
                    }
                }
            }

            setQuestPhotos(photoMap)
            setIsLoadingPhotos(false)
        }

        fetchPhotos()
    }, [quests])
    if (!quests || quests.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    No quests found.
                </p>
            </div>
        )
    }

    if (isLoadingPhotos && questPhotos.size === 0) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quests.map((quest) => (
                    <div key={quest.id} className="animate-pulse">
                        <Card className="h-full">
                            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                            </CardHeader>
                        </Card>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quests.map((quest) => (
                <QuestCard
                    key={quest.id}
                    quest={quest}
                    photo={questPhotos.get(quest.id)}
                />
            ))}
        </div>
    )
}
