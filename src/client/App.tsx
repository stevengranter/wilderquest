// src/App.tsx
import { AppProviders } from '@/providers/AppProviders'
import { RouterProvider } from 'react-router'
import { router } from '@/routes/routes'

export default function App() {
    return (
        <AppProviders>

            {/*<ChatbotOld />*/}
            <RouterProvider router={router} />

        </AppProviders>
    )
}
