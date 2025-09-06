// src/App.tsx
import { AppProviders } from '@/core/providers/AppProviders'
import { RouterProvider } from 'react-router'
import { router } from '@/core/routing/routes'

export default function App() {
    return (
        <AppProviders>
            {/*<ChatbotOld />*/}
            <RouterProvider router={router} />
        </AppProviders>
    )
}
