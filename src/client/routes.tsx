// src/routes/routes.tsx

import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home } from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import UserProfile from '@/pages/UserProfile'
import EditQuest from '@/components/EditQuest'
import QuestDetail from '@/components/QuestDetail'
import { CreateQuest } from '@/pages/CreateQuest'
import { QuestsPage } from '@/pages/QuestsPage'
import UserQuestsPage from '@/pages/UserQuestsPage'
import SharedQuestGuest from '@/pages/SharedQuestGuest'
import { AppLayout } from '@/components/AppLayout'
import { QuestProvider } from '@/components/QuestContext'
import { useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

// Wrapper component for EditQuest to provide QuestProvider
function EditQuestWrapper() {
    const { questId } = useParams<{ questId: string }>()
    const { user } = useAuth()

    if (!questId) {
        return <div>Quest not found</div>
    }

    return (
        <QuestProvider questId={questId} user={user || undefined}>
            <EditQuest />
        </QuestProvider>
    )
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Home />,
            },
            {
                path: 'share/:token',
                element: <SharedQuestGuest />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'register',
                element: <Register />,
            },
            {
                path: 'users/:username',
                element: <UserProfile />,
            },
            {
                path: 'quests',
                children: [
                    {
                        index: true,
                        element: <QuestsPage />,
                    },
                    {
                        path: ':questId',
                        element: <QuestDetail />,
                    },
                    {
                        path: ':questId/edit',
                        element: (
                            <ProtectedRoute>
                                <EditQuestWrapper />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'user/:userId',
                        element: <UserQuestsPage />,
                    },
                    {
                        path: 'new/*',
                        element: (
                            <ProtectedRoute>
                                <CreateQuest />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },
        ],
    },
])
