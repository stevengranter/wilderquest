// src/providers/AppProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from 'next-themes'
import GeoLocationProvider from '@/contexts/GeoLocationProvider'

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <GeoLocationProvider>
                    <ThemeProvider attribute='class' disableTransitionOnChange>
                        {children}
                    </ThemeProvider>
                </GeoLocationProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
