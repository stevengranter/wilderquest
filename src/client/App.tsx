import { RouterProvider } from 'react-router'
import { router } from '@/routes'
import { clientDebug } from './lib/debug'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import queryClient from '@/lib/queryClient'

export default function App() {
    // Test debug message on app load
    clientDebug.general('🚀 App component loaded')

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>
    )
}
