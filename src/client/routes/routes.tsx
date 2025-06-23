// src/routes/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router'
import { ExploreTab } from './explore/ExploreTab'
import { IdentifyTab } from './identify/IdentifyTab'
import { LocateTab } from './locate/LocateTab'
import { AppLayout } from '@/layouts/AppLayout'
import Login from '@/components/pages/Login'
import Welcome from '@/components/pages/Welcome'
import Register from '@/components/pages/Register'
import CollectionDetail from '@/features/collections/CollectionDetail'
import CollectionsList from '@/features/collections/CollectionsList'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                index: true, // Match the root path exactly
                element: <Navigate to='/explore' replace />, // Redirect to /explore
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
                        element: <CollectionsList />, // Or a component that shows all collections
                    },
                    {
                        path: ':collectionId',
                        element: <CollectionDetail />,
                    },
                ],
            },
        ],
    },
])
