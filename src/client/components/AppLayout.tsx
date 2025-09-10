import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { MainMenu } from './MainMenu'
import { Footer } from './Footer'

export function AppLayout() {
    return (
        <div className="mx-2 md:mx-4">
            <ScrollRestoration />
            <MainMenu />
            <Outlet />
            <Toaster />
            <Footer />
        </div>
    )
}
