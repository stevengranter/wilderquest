// src/App.tsx
import { AppProviders } from '@/providers/AppProviders'
// import { RouterProvider } from 'react-router'
// import { router } from '@/routes/routes'
import Chatbot from '@/components/Chatbot'

export default function App() {
    return (
        <AppProviders>
            <Chatbot />
            {/*<RouterProvider router={router} />*/}
        </AppProviders>
    )
}
