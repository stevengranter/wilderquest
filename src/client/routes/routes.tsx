// src/routes/routes.tsx

import { User } from 'lucide-react'
import { createBrowserRouter, Navigate } from 'react-router'
import Login from '@/components/pages/Login'
import Register from '@/components/pages/Register'
import Welcome from '@/components/pages/Welcome'
import CollectionDetail from '@/features/collections/CollectionDetail'
import CollectionsList from '@/features/collections/CollectionsList'
import UserCollectionsManager from '@/features/collections/UserCollectionsManager'
import { AppLayout } from '@/layouts/AppLayout'
import { ExploreTab } from './explore/ExploreTab'
import { IdentifyTab } from './identify/IdentifyTab'
import { LocateTab } from './locate/LocateTab'
import {Home} from "../components/pages/Home"
import { QuestsPage } from '@/features/quests/pages/QuestsPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true, // Match the root path exactly
                // element: <Navigate to="/explore" replace />, // Redirect to /explore
                element: <Home />
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

                ],
            },
        ],
    },
])
