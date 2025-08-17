// src/providers/AppProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 30 minutes to reduce API calls
            staleTime: 30 * 60 * 1000, // 30 minutes
            cacheTime: 60 * 60 * 1000, // 1 hour
            // Retry configuration for rate limiting
            retry: (failureCount, error: any) => {
                // Don't retry on rate limit errors (429)
                if (error?.response?.status === 429) return false
                // Don't retry on client errors (4xx)
                if (
                    error?.response?.status >= 400 &&
                    error?.response?.status < 500
                )
                    return false
                // Retry up to 2 times for other errors
                return failureCount < 2
            },
            // Exponential backoff for retries
            retryDelay: (attemptIndex) =>
                Math.min(1000 * 2 ** attemptIndex, 10000),
            // Reduce refetch frequency to be more respectful to APIs
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
        },
    },
})

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
