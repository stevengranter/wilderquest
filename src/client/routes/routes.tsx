// src/routes/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router'
import { TabsLayout } from '@/layouts/TabsLayout'
import { ExploreTab } from './explore/ExploreTab'
import { IdentifyTab } from './identify/IdentifyTab'
import { LocateTab } from './locate/LocateTab'
import TabletopLayout from '@/layouts/TabletopLayout'
import Dashboard from '@/components/dashboard/Dashboard'
import { AppLayout } from '@/layouts/AppLayout'

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
        ],
    },
])
