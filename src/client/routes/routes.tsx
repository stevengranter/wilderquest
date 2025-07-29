// src/routes/routes.tsx

import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home } from '@/components/pages/Home'
import Login from '@/components/pages/Login'
import Register from '@/components/pages/Register'
import Welcome from '@/components/pages/Welcome'
import CollectionDetail from '@/features/collections/CollectionDetail'
import UserCollectionsManager from '@/features/collections/UserCollectionsManager'
import QuestDetail from '@/features/quests/components/QuestDetail'
import { CreateQuest } from '@/features/quests/pages/CreateQuest'
import { QuestsPage } from '@/features/quests/pages/QuestsPage'
import { AppLayout } from '@/layouts/AppLayout'
import { ExploreTab } from './explore/ExploreTab'
import { IdentifyTab } from './identify/IdentifyTab'
import { LocateTab } from './locate/LocateTab'

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
                path: 'explore',
                children: [
                    {
                        index: true,
                        element: <ExploreTab />,
                    },
                    {
                        path: ':taxonId',
                        element: <ExploreTab />,
                    },
                ],
            },
            {
                path: 'identify',
                element: <IdentifyTab />,
            },
            {
                path: 'locate',
                element: <LocateTab />,
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
                path: 'welcome',
                element: <Welcome />,
            },
            {
                path: 'collections',
                children: [
                    {
                        index: true, // For /collection (no ID)
                        element: <UserCollectionsManager />, // Or a component that shows all collections
                    },
                    {
                        path: ':collectionId',
                        element: <CollectionDetail />,
                    },
                ],
            },
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
                    },
                    {
                        path: 'create',
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
