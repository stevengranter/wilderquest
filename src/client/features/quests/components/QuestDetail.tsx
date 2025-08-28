import { useLoaderData, useParams } from 'react-router'
import { QuestProvider } from '@/contexts/QuestContext'
import { QuestView } from './QuestView/QuestView'

interface QuestProps {
    questId?: string | number
}

export default function QuestDetail({ questId: propQuestId }: QuestProps) {
    const routeParams = useParams()
    const urlQuestId = routeParams.questId
    const activeQuestId = propQuestId || urlQuestId
    const initialData = useLoaderData()

    if (!activeQuestId) {
        return <div>Quest not found</div>
    }

    return (
        <QuestProvider questId={activeQuestId} initialData={initialData}>
            <QuestView />
        </QuestProvider>
    )
}
