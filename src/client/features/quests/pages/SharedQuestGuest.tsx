import { useParams } from 'react-router'
import { QuestProvider } from '@/contexts/QuestContext'
import { QuestView } from '@/features/quests/components/QuestView/QuestView'

export default function SharedQuestGuest() {
    const { token } = useParams()

    return (
        <QuestProvider token={token}>
            <QuestView />
        </QuestProvider>
    )
}
