import { RouterProvider } from 'react-router'
import { router } from '@/routes'
import { clientDebug } from './lib/debug'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from '@/lib/queryClient'
import { AuthProvider } from '@/providers/AuthProvider'

export default function App() {
    // Test debug message on app load
    clientDebug.general('🚀 App component loaded')

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </AuthProvider>
    )
}
