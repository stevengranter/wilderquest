import { useEffect, useState } from 'react'
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
                        <Link to={paths.newQuest()}>Create Quest</Link>
                    </Button>
                </div>
            </div>
            <QuestsList quests={quests} />
        </div>
    )
}

function QuestsList({ quests }: { quests: QuestWithTaxa[] }) {
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
            {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
            ))}
        </div>
    )
}
