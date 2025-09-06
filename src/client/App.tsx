// src/App.tsx
import { AppProviders } from '@/core/providers/AppProviders'
import { RouterProvider } from 'react-router'
import { router } from '@/core/routing/routes'
import { clientDebug } from '@shared/utils/debug'

export default function App() {
    // Test debug message on app load
    clientDebug.general('🚀 App component loaded')

    return (
        <AppProviders>
            {/*<ChatbotOld />*/}
            <RouterProvider router={router} />
        </AppProviders>
    )
}
