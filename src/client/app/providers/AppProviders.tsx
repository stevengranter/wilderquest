// src/providers/AppProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { configureApiTokens } from '@/core/api/axios'
import { AuthProvider, useAuth } from '@/core/auth/useAuth'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 30 minutes to reduce API calls
            staleTime: 30 * 60 * 1000, // 30 minutes
            gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
            // Retry configuration for rate limiting
            retry: (failureCount, error: unknown) => {
                // Don't retry on rate limit errors (429)
                if (
                    error &&
                    typeof error === 'object' &&
                    'response' in error &&
                    error.response &&
                    typeof error.response === 'object' &&
                    'status' in error.response &&
                    typeof error.response.status === 'number'
                ) {
                    if (error.response.status === 429) return false
                    // Don't retry on client errors (4xx)
                    if (
                        error.response.status >= 400 &&
                        error.response.status < 500
                    )
                        return false
                }
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

// Component to configure API tokens with useAuth context
function ApiTokenConfigurator() {
    const { getValidToken } = useAuth()

    useEffect(() => {
        // Configure the axios instance to use the auth context's token getter
        configureApiTokens(getValidToken)
    }, [getValidToken])

    return null // This component doesn't render anything
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ApiTokenConfigurator />
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
