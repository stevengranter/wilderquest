import { useParams } from 'react-router'
import { useEffect } from 'react'
import { QuestProvider } from '@/features/quests/context/QuestContext'
import { QuestView } from '@/features/quests/components/QuestView/QuestView'
import api from '@/core/api/axios'
import { clientDebug } from '@shared/utils/debug'

export default function SharedQuestGuest() {
    const { token } = useParams()

    // Track page access when component mounts
    useEffect(() => {
        if (token) {
            // Track that this user has accessed the shared quest page
            api.post(`/quest-sharing/shares/token/${token}/accessed`).catch(
                (err: unknown) => {
                    // Silently fail - access tracking is not critical
                    clientDebug.events('Access tracking failed:', err)
                }
            )
        }
    }, [token])

    return (
        <QuestProvider token={token}>
            <QuestView />
        </QuestProvider>
    )
}
