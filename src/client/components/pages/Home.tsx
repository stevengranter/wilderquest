import { ArrowRight, ChevronRight, Compass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '@/api/api'
import { QuestCard } from '@/components/quest/QuestCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useQuestPhotos } from '@/hooks/useTaxonPhotos'
import { QuestWithTaxa } from '../../../types/types'
import { paths } from '@/routes/paths'

function StatsCard({
                       icon: Icon,
                       label,
                       value,
                       description,
                   }: {
    icon: any
    label: string
    value: string
    description: string
}) {
    return (
        <Card className="text-center">
            <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {value}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-400">
                    {description}
                </div>
            </CardContent>
        </Card>
    )
}

export function Home() {
    const { isAuthenticated, user } = useAuth()
    const [recentQuests, setRecentQuests] = useState<QuestWithTaxa[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        totalQuests: 0,
        activeQuests: 0,
        totalSpecies: 0,
    })

    // Use React Query to fetch photos for recent quests
    const { photoMap: questPhotos, isLoading: photosLoading } = useQuestPhotos(
        recentQuests.length > 0 ? recentQuests : []
    )

    useEffect(() => {
        const fetchRecentQuests = async () => {
            try {
                setIsLoading(true)
                const response = await api.get('/quests')
                const allQuests = response.data as QuestWithTaxa[]

                // Get the 6 most recent quests (sorted by creation date)
                const recent = allQuests
                    .sort(
                        (a, b) =>
                            new Date(b.created_at || '').getTime() -
                            new Date(a.created_at || '').getTime()
                    )
                    .slice(0, 6)

                setRecentQuests(recent)

                // Calculate stats
                const activeCount = allQuests.filter(
                    (q) => q.status === 'active'
                ).length
                const totalSpecies = allQuests.reduce(
                    (sum, quest) => sum + (quest.taxon_ids?.length || 0),
                    0
                )

                setStats({
                    totalQuests: allQuests.length,
                    activeQuests: activeCount,
                    totalSpecies,
                })

                setIsLoading(false)
            } catch (error) {
                console.error('Failed to fetch recent quests:', error)
                setIsLoading(false)
            }
        }

        fetchRecentQuests()
    }, [])

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative px-4 pt-20 pb-16 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                        wilderQuest
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Join a community of explorers
                    </p>
                </div>

                <Link to={paths.quests()} viewTransition>
                    <Button size="lg" className="w-70 h-18 text-2xl cursor-pointer" >
                        <Compass />Explore Quests</Button></Link>
            </section>

            {/* Recent Quests Section */}
            <section className="px-4 py-16 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Explore
                        </h2>
                        <p className="text-muted-foreground">
                            See quests from our community
                        </p>
                    </div>
                    <Button className="group" asChild>
                        <Link to={paths.quests()} viewTransition>
                            View All
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="h-full">
                                <div className="h-48">
                                    <Skeleton className="w-full h-full" />
                                </div>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : recentQuests.length > 0 ? (
                    <div className="grid gap-4 auto-rows-fr" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        {recentQuests.map((quest) => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                hoverEffect="lift"
                                photo={questPhotos.get(quest.id) || undefined}

                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                            <Compass className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            No quests yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Be the first to create a nature quest!
                        </p>
                        <Button asChild>
                            <Link to={paths.newQuest()}>Create First Quest</Link>
                        </Button>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="px-4 py-20 max-w-4xl mx-auto text-center">
                <div className="bg-emerald-600 rounded-2xl p-12 text-white relative overflow-hidden">
                    <div className="relative">
                        <h2 className="text-3xl font-bold mb-4">
                            Ready to Start Your Nature Adventure?
                        </h2>
                        <p className="text-xl mb-8 text-emerald-50">
                            Join other nature enthusiasts documenting
                            biodiversity around the world.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="px-8"
                                asChild
                            >
                                <Link to="/quests">
                                    Browse Quests
                                    <Compass className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            {!isAuthenticated && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="px-8 border-white text-white hover:bg-white hover:text-emerald-600 dark:hover:bg-gray-100 dark:hover:text-emerald-700"
                                    asChild
                                >
                                    <Link to="/register">
                                        Sign Up Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}