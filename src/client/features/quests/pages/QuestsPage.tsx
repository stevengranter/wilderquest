import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/core/api/axios'
import { QuestCard } from '@/features/quests/components/QuestCard'
import { QuestCardSkeleton } from '@/features/quests/components/QuestCardSkeleton'
import { Button, Label, Switch } from '@/components/ui'
import { paths } from '@/core/routing/paths'
import { QuestWithTaxa } from '@shared/types'
import { useAuth } from '@/features/auth/useAuth'
import { useQuestPhotoCollage } from '@/hooks/useTaxonPhotos'
import { useDebounce } from '@/hooks/useDebounce'

export function QuestsPage() {
    const { isAuthenticated, user } = useAuth()

    const [quests, setQuests] = useState<QuestWithTaxa[]>([])
    const [isMyQuests, setIsMyQuests] = useState<boolean>(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)

    // Debounce the isMyQuests state to prevent rapid API calls
    const debouncedIsMyQuests = useDebounce(isMyQuests, 300)

    const observer = useRef<IntersectionObserver | null>(null)

    const lastQuestElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (loading) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1)
                }
            })
            if (node) observer.current.observe(node)
        },
        [loading, hasMore]
    )

    function handleChange() {
        setQuests([])
        setPage(1)
        setHasMore(true)
        setIsMyQuests(!isMyQuests)
    }

    useEffect(() => {
        setLoading(true)
        const fetchQuests = async () => {
            try {
                const endpoint = debouncedIsMyQuests
                    ? `/quests/user/${user?.id}?page=${page}&limit=10`
                    : `/quests?page=${page}&limit=10`

                if (debouncedIsMyQuests && (!isAuthenticated || !user)) {
                    toast.error('You are not logged in!')
                    setLoading(false)
                    return
                }

                const response = await api.get(endpoint)
                setQuests((prevQuests) => {
                    const existingQuestIds = new Set(
                        prevQuests.map((q) => q.id)
                    )
                    const newQuests = response.data.filter(
                        (quest: QuestWithTaxa) =>
                            !existingQuestIds.has(quest.id)
                    )
                    return [...prevQuests, ...newQuests]
                })
                setHasMore(response.data.length > 0)
            } catch (_error) {
                toast.error('Failed to fetch quests.')
            } finally {
                setLoading(false)
            }
        }

        fetchQuests()
    }, [debouncedIsMyQuests, isAuthenticated, user, page])

    const { questToPhotosMap, isLoading: collagePhotosIsLoading } =
        useQuestPhotoCollage(quests)

    // Simple observe function (no-op since we load all photos)
    const observeQuest = useCallback(
        (questId: number, element: HTMLElement | null) => {
            // No-op - we load all photos
        },
        []
    )

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
                        <Link to={paths.newQuest()}>Create Quest</Link>
                    </Button>
                </div>
            </div>
            <QuestsList
                quests={quests}
                lastQuestElementRef={lastQuestElementRef}
                questToPhotosMap={questToPhotosMap}
                photosLoading={collagePhotosIsLoading}
                loading={loading}
                observeQuest={observeQuest}
            />
        </div>
    )
}

function QuestsList({
    quests,
    lastQuestElementRef,
    questToPhotosMap,
    photosLoading,
    loading,
    observeQuest,
}: {
    quests: QuestWithTaxa[]
    lastQuestElementRef: (node: HTMLDivElement) => void
    questToPhotosMap: Map<number, string[]>
    photosLoading: boolean
    loading: boolean
    observeQuest: (questId: number, element: HTMLElement | null) => void
}) {
    if (loading && quests.length === 0) {
        return (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden p-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <QuestCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (!quests || quests.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                    No quests found.
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden p-1">
            <AnimatePresence>
                {quests.map((quest, index) => {
                    const questPhotos = questToPhotosMap.get(quest.id) || []
                    const card = (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            photos={questPhotos}
                            isLoading={
                                photosLoading &&
                                (questToPhotosMap.get(quest.id) === undefined ||
                                    questPhotos.length === 0)
                            }
                            observeQuest={observeQuest}
                            scaleTextToFit={true}
                        />
                    )

                    if (quests.length === index + 1) {
                        return (
                            <div ref={lastQuestElementRef} key={quest.id}>
                                {card}
                            </div>
                        )
                    } else {
                        return card
                    }
                })}
            </AnimatePresence>
            {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                    <QuestCardSkeleton key={`skeleton-${i}`} />
                ))}
        </div>
    )
}
