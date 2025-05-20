// src/routes/routes.tsx
import { createBrowserRouter } from 'react-router'
import { TabsLayout } from '@/layouts/TabsLayout'
import { ExploreTab } from './explore/ExploreTab'
import { IdentifyTab } from './identify/IdentifyTab'
import { LocateTab } from './locate/LocateTab'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <TabsLayout />,
        children: [
            {
                path: 'explore',
                children: [
                    {
                        index: true,  // This will be the default route for /explore
                        element: <ExploreTab />,
                    },
                    {
                        path: ':taxonId',  // This creates the /explore/:taxaId route
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
