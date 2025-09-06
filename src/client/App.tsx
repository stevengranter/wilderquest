// src/App.tsx
import { AppProviders } from '@/app/providers/AppProviders'
import { RouterProvider } from 'react-router'
import { router } from '@/app/routing/routes'

export default function App() {
    return (
        <AppProviders>
            {/*<ChatbotOld />*/}
            <RouterProvider router={router} />
        </AppProviders>
    )
}
