import { useInfiniteQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import api from '@/core/api/axios'
import { QuestCard } from '@/features/quests/components/QuestCard'
import { QuestWithTaxa } from '@shared/types'
import { useCallback, useRef } from 'react'

const fetchUserQuests = async ({
    pageParam = 1,
    userId,
}: {
    pageParam?: number
    userId?: string
}) => {
    const res = await api.get(
        `/quests/user/${userId}?page=${pageParam}&limit=10`
    )
    return {
        quests: res.data,
        nextPage: res.data.length === 10 ? pageParam + 1 : undefined,
    }
}

export default function UserQuestsPage() {
    const { userId } = useParams()

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['userQuests', userId],
        queryFn: ({ pageParam }) => fetchUserQuests({ pageParam, userId }),
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
    })

    const observer = useRef<IntersectionObserver | null>(null)
    const lastQuestElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isFetchingNextPage) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage]
    )

    if (status === 'pending') return 'Loading...'

    if (status === 'error') return 'An error has occurred: ' + error.message

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-4">User Quests</h1>
            <QuestsList
                quests={data?.pages.flatMap((page) => page.quests) || []}
                lastQuestElementRef={lastQuestElementRef}
            />
            {isFetchingNextPage && <p>Loading...</p>}
        </div>
    )
}

function QuestsList({
    quests,
    lastQuestElementRef,
}: {
    quests: QuestWithTaxa[]
    lastQuestElementRef: (node: HTMLDivElement) => void
}) {
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden p-1">
            {quests.map((quest, index) => {
                if (quests.length === index + 1) {
                    return (
                        <div ref={lastQuestElementRef} key={quest.id}>
                            <QuestCard quest={quest} scaleTextToFit={true} />
                        </div>
                    )
                } else {
                    return (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            scaleTextToFit={true}
                        />
                    )
                }
            })}
        </div>
    )
}
