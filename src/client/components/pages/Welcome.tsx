import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ReactSVG } from 'react-svg'
import avatar from 'animal-avatar-generator'
import api from '@/api/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { INatTaxon } from '@shared/types/iNatTypes'
import { QuestWithTaxa } from '../../../types/types'

interface QuestCardProps {
    quest: QuestWithTaxa
    photo?: string
}

function QuestCard({ quest, photo }: QuestCardProps) {
    return (
        <Link to={`/quests/${quest.id}`} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden p-0">
                {photo && (
                    <div className="h-32 overflow-hidden">
                        <img
                            src={photo}
                            alt={`Photo from ${quest.name}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <CardHeader className="px-4 pt-3 pb-2">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{quest.name}</CardTitle>
                        {quest.is_private && (
                            <Badge variant="neutral" className="ml-2 text-xs">
                                Private
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                {quest.description && (
                    <CardContent className="px-4 pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {quest.description}
                        </p>
                    </CardContent>
                )}
                <CardFooter className="px-4 pb-3 pt-1 flex justify-between items-center">
                    <Badge
                        variant={
                            quest.status === 'active' ? 'default' : 'neutral'
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
                    {quest.taxon_ids && quest.taxon_ids.length > 0 && (
                        <Badge variant="neutral" className="text-xs">
                            {quest.taxon_ids.length} species
                        </Badge>
                    )}
                </CardFooter>
            </Card>
        </Link>
    )
}

function UserQuests() {
    const { user } = useAuth()
    const [questPhotos, setQuestPhotos] = useState<Map<number, string>>(
        new Map()
    )

    const {
        data: quests = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['userQuests', user?.id],
        queryFn: () =>
            api.get(`/quests/user/${user?.id}`).then((res) => res.data),
        enabled: !!user?.id,
    })

    // Fetch photos for quests
    useEffect(() => {
        const fetchPhotos = async () => {
            if (quests.length === 0) return

            const photoMap = new Map<number, string>()
            const questTaxonMap = new Map<number, number[]>()
            const allTaxonIds = new Set<number>()

            // Collect taxon IDs from all quests
            for (const quest of quests) {
                let taxonIds = quest.taxon_ids || []

                if (taxonIds.length === 0) {
                    try {
                        const questResponse = await api.get(
                            `/quests/${quest.id}`
                        )
                        taxonIds = questResponse.data.taxon_ids || []
                    } catch (error) {
                        continue
                    }
                }

                if (taxonIds && taxonIds.length > 0) {
                    const selectedIds = taxonIds.slice(0, 3)
                    questTaxonMap.set(quest.id, selectedIds)
                    selectedIds.forEach((id: number) => allTaxonIds.add(id))
                }
            }

            // Batch taxon IDs into chunks
            const uniqueTaxonIds = Array.from(allTaxonIds)
            const chunks = []
            for (let i = 0; i < uniqueTaxonIds.length; i += 20) {
                chunks.push(uniqueTaxonIds.slice(i, i + 20))
            }

            const allTaxa = new Map<number, INatTaxon>()

            for (let i = 0; i < chunks.length; i++) {
                try {
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
                } catch (error: any) {
                    if (error.response?.status === 429) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        )
                    }
                }
            }

            // Assign photos to quests
            for (const [questId, taxonIds] of questTaxonMap) {
                for (const taxonId of taxonIds) {
                    const taxon = allTaxa.get(taxonId)
                    if (taxon?.default_photo?.medium_url) {
                        photoMap.set(questId, taxon.default_photo.medium_url)
                        break
                    }
                }
            }

            setQuestPhotos(photoMap)
        }

        fetchPhotos()
    }, [quests])

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <Card className="h-full">
                            <div className="h-32 bg-gray-200 rounded-t-lg"></div>
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

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Failed to load quests</p>
            </div>
        )
    }

    if (!quests || quests.length === 0) {
        return (
            <Card className="text-center py-8">
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">
                        No Quests Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Start your wildlife adventure by creating your first
                        quest!
                    </p>
                    <Button asChild>
                        <Link to="/quests/create">Create Your First Quest</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quests.slice(0, 6).map((quest: QuestWithTaxa) => (
                <QuestCard
                    key={quest.id}
                    quest={quest}
                    photo={questPhotos.get(quest.id)}
                />
            ))}
        </div>
    )
}

const Welcome = () => {
    const { user } = useAuth()

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">
                        Welcome to Wildernest
                    </h1>
                    <p className="text-muted-foreground">
                        Please log in to continue
                    </p>
                </div>
            </div>
        )
    }

    const avatarSvg = avatar(user.cuid, { size: 100 })

    return (
        <div className="container mx-auto px-4 py-8">
            {/* User Header */}
            <div className="mb-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                                <ReactSVG
                                    src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`}
                                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-border"
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">
                                    Welcome back, {user.username}! 🌿
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Ready for your next wildlife adventure?
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="default" asChild>
                                    <Link to="/quests">View All Quests</Link>
                                </Button>
                                <Button variant="neutral" asChild>
                                    <Link to="/quests/create">
                                        Create Quest
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card>
                    <CardContent className="text-center py-6">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            🎯
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Active Quests
                        </div>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="text-center py-6">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            🔍
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Species Found
                        </div>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="text-center py-6">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                            📸
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Observations
                        </div>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="text-center py-6">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                            🏆
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Completed
                        </div>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Quests Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Your Recent Quests</h2>
                    <Button variant="neutral" asChild>
                        <Link to="/quests">View All</Link>
                    </Button>
                </div>
                <UserQuests />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🔍</span>
                                Explore Species
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Search and learn about different species in your
                                area
                            </p>
                            <Button
                                variant="neutral"
                                className="w-full"
                                asChild
                            >
                                <Link to="/explore">Start Exploring</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">📱</span>
                                Quick Identify
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Use AI to identify species from your photos
                            </p>
                            <Button
                                variant="neutral"
                                className="w-full"
                                asChild
                            >
                                <Link to="/identify">Start Identifying</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                Browse Quests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Discover and join exciting wildlife quests
                            </p>
                            <Button
                                variant="neutral"
                                className="w-full"
                                asChild
                            >
                                <Link to="/quests">Browse Quests</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Welcome
