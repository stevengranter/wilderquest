import { ArrowRight, ChevronRight, Compass } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/core/api/axios'
import { QuestCard } from '@/features/quests/components/QuestCard'
import { QuestCardSkeleton } from '@/features/quests/components/QuestCardSkeleton'
import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import { useAuth } from '@/features/auth/useAuth'
import { paths } from '@/core/routing/paths'
import { QuestWithTaxa } from '@/types'
import { useQuestPhotoCollage } from '@/hooks/useTaxonPhotos'

function _StatsCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
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
    const { user: _user, isAuthenticated } = useAuth()

    // Use React Query for efficient caching and automatic refetching
    const { data: recentQuests = [], isLoading } = useQuery({
        queryKey: ['homepageQuests'],
        queryFn: async () => {
            const response = await api.get('/quests?page=1&limit=6')
            return response.data as QuestWithTaxa[]
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    })

    // Basic stats - will be enhanced with a dedicated stats endpoint later
    // const stats = {
    //     totalQuests: 0,
    //     activeQuests: 0,
    //     totalSpecies: 0,
    // }

    // Use the same photo loading approach as QuestsPage
    const { questToPhotosMap, isLoading: photosLoading } = useQuestPhotoCollage(
        recentQuests || []
    )

    return (
        <div className="min-h-screen bg-background animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="relative px-4 pt-20 pb-16 text-center animate-in fade-in duration-700">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                        wilderQuest
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Join a community of explorers
                    </p>
                </div>

                <Link to={paths.quests()} viewTransition>
                    <Button
                        size="lg"
                        className="w-70 h-18 text-2xl cursor-pointer"
                    >
                        <Compass />
                        Explore Quests
                    </Button>
                </Link>
            </section>

            {/* Recent Quests Section */}
            <section className="px-4 py-16 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
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
                    <div
                        className="grid gap-8 auto-rows-fr overflow-hidden p-1"
                        style={{
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(280px, 1fr))',
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <QuestCardSkeleton key={i} />
                        ))}
                    </div>
                ) : recentQuests.length > 0 ? (
                    <div
                        className="grid gap-8 auto-rows-fr overflow-hidden p-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
                        style={{
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(280px, 1fr))',
                        }}
                    >
                        {recentQuests.map((quest) => {
                            const questPhotos =
                                questToPhotosMap.get(quest.id) || []
                            return (
                                <QuestCard
                                    key={quest.id}
                                    quest={quest}
                                    hoverEffect="lift"
                                    animate={false}
                                    photos={questPhotos}
                                    isLoading={
                                        photosLoading &&
                                        questPhotos.length === 0
                                    }
                                    scaleTextToFit={true}
                                />
                            )
                        })}
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
                            <Link to={paths.newQuest()}>
                                Create First Quest
                            </Link>
                        </Button>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="hidden px-4 py-20 max-w-4xl mx-auto text-center">
                <div className="bg-main rounded-2xl p-12 text-white relative overflow-hidden">
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
                                variant="neutral"
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
                                    variant="neutral"
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
