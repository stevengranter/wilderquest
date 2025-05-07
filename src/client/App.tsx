import './App.css'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThreeFiberCanvasProvider } from '@/contexts/ThreeFiberCanvasContext'
import { HostCharacterProvider } from '@/contexts/HostCharacterProvider'

const queryClient = new QueryClient()

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Outlet />
                <Toaster />
                <ThreeFiberCanvasProvider>
                    <HostCharacterProvider character="axolotl" />
                </ThreeFiberCanvasProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
