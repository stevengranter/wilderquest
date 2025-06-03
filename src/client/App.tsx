// src/App.tsx
import { AppProviders } from '@/providers/AppProviders'
import { RouterProvider } from 'react-router'
import { router } from '@/routes/routes'
// import ChatbotOld from '@/components/ChatbotOld'
import Tabletop from '@/components/tabletop/Tabletop'

export default function App() {
    return (
        <AppProviders>

            {/*<ChatbotOld />*/}
            <RouterProvider router={router}>

            </RouterProvider>
        </AppProviders>
    )
}
