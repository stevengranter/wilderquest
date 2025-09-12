import { useParams } from 'react-router'
import { useEffect } from 'react'
import { QuestProvider } from '@/components/QuestContext'
import { QuestView } from '@/components/QuestView'
import api from '@/lib/axios'
import { clientDebug } from '../lib/debug'

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
        <QuestProvider token={token} user={undefined}>
            <QuestView />
        </QuestProvider>
    )
}
