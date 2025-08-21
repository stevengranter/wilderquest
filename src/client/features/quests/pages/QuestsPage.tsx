import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import api from '@/api/api'
import { QuestCard } from '@/components/quest/QuestCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { paths } from '@/routes/paths'
import { QuestWithTaxa } from '../../../../types/types'
import { useAuth } from '@/hooks/useAuth'

export function QuestsPage() {
    const { isAuthenticated, user } = useAuth()

    const [quests, setQuests] = useState<QuestWithTaxa[]>([])
    const [isMyQuests, setIsMyQuests] = useState<boolean>(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)

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
        if (!isMyQuests) {
            api.get(`/quests?page=${page}&limit=10`).then((response) => {
                setQuests((prevQuests) => [...prevQuests, ...response.data])
                setHasMore(response.data.length > 0)
                setLoading(false)
            })
            return
        }

        if (!isAuthenticated || !user) {
            toast.error('You are not logged in!')
            setLoading(false)
            return
        }

        api.get(`/quests/user/${user.id}?page=${page}&limit=10`).then((response) => {
            setQuests((prevQuests) => [...prevQuests, ...response.data])
            setHasMore(response.data.length > 0)
            setLoading(false)
        })
    }, [isMyQuests, isAuthenticated, user, page])

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
            <QuestsList quests={quests} lastQuestElementRef={lastQuestElementRef} />
            {loading && <p>Loading...</p>}
        </div>
    )
}

function QuestsList({ quests, lastQuestElementRef }: { quests: QuestWithTaxa[], lastQuestElementRef: (node: HTMLDivElement) => void }) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quests.map((quest, index) => {
                if (quests.length === index + 1) {
                    return <div ref={lastQuestElementRef} key={quest.id}><QuestCard quest={quest} /></div>
                } else {
                    return <QuestCard key={quest.id} quest={quest} />
                }
            })}
        </div>
    )
}
