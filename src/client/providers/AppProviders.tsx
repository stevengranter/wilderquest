// src/providers/AppProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {/*<GeoLocationProvider>*/}
                {/*    <ThemeProvider attribute="class" disableTransitionOnChange>*/}
                {/*        {children}*/}
                {/*    </ThemeProvider>*/}
                {/*</GeoLocationProvider>*/}
                {children}
            </AuthProvider>
        </QueryClientProvider>
    )
}
