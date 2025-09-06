// src/routes/routes.tsx

import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Home } from '@/core/routing/pages/Home'
import Login from '@/features/auth/pages/Login'
import Register from '@/features/auth/pages/Register'
import UserProfile from '@/features/users/pages/UserProfile'
import EditQuest from '@/features/quests/components/EditQuest'
import QuestDetail from '@/features/quests/components/QuestDetail'
import { CreateQuest } from '@/features/quests/pages/CreateQuest'
import { QuestsPage } from '@/features/quests/pages/QuestsPage'
import UserQuestsPage from '@/features/quests/pages/UserQuestsPage'
import SharedQuestGuest from '@/features/quests/pages/SharedQuestGuest'
import { AppLayout } from '@/layouts/AppLayout'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true, // Match the root path exactly
                // element: <Navigate to="/explore" replace />, // Redirect to /explore
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
            // {
            //     path: 'collections',
            //     children: [
            //         {
            //             index: true, // For /collection (no ID)
            //             element: <UserCollectionsManager />, // Or a component that shows all collections
            //         },
            //         {
            //             path: ':collectionId',
            //             element: <CollectionDetail />,
            //         },
            //     ],
            // },
            {
                path: 'quests',
                children: [
                    {
                        index: true, // For /quests (no ID)
                        element: <QuestsPage />,
                    },
                    {
                        path: ':questId',
                        element: <QuestDetail />,
                        // loader: questLoader(queryClient),
                    },
                    {
                        path: ':questId/edit',
                        element: (
                            <ProtectedRoute>
                                <EditQuest />
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
