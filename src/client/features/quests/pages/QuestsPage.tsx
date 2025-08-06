import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { Collection } from '../../../../types/types'

export function QuestsPage() {
    const { isAuthenticated, user } = useAuth()
    const [quests, setQuests] = useState<Collection[]>([])
    const [isMyQuests, setIsMyQuests] = useState<boolean>(false)

    function handleChange() {
        setIsMyQuests(!isMyQuests)
    }

    useEffect(() => {
        if (!isMyQuests) {
            api.get('/quests').then((response) => {
                console.log(response.data)
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
        <>
            <h1>Quests</h1>
            <div className="flex items-center space-x-2">
                <Switch
                    id="airplane-mode"
                    checked={isMyQuests}
                    onCheckedChange={handleChange}
                />
                <Label htmlFor="airplane-mode">My Quests</Label>
            </div>
            <QuestsList quests={quests} />
            <Button>
                <Link to="/quests/create">Create Quest</Link>
            </Button>
        </>
    )
}

function QuestsList({ quests }: { quests: Collection[] }) {
    if (!quests || quests.length === 0) return <p>No quests found.</p>

    return (
        <ul>
            {quests.length > 0 ? (
                quests.map((quest) => (
                    <li key={quest.id}>
                        <Link to={`/quests/${quest.id}`}>{quest.name}</Link>
                    </li>
                ))
            ) : (
                <p>No quests found</p>
            )}
        </ul>
    )
}
