import './App.css'
import { Outlet } from 'react-router'
// import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ThreeFiberCanvasProvider } from '@/contexts/ThreeFiberCanvasContext'
import { ThemeProvider } from 'next-themes'
import GeoLocationProvider from '@/contexts/GeoLocationProvider'

const queryClient = new QueryClient()

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <GeoLocationProvider>
                    <ThemeProvider attribute='class' disableTransitionOnChange>
                        <Outlet />

                        {/*<Toaster />*/}
                        {/*<ThreeFiberCanvasProvider></ThreeFiberCanvasProvider>*/}
                    </ThemeProvider>
                </GeoLocationProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
