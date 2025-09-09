import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { MainMenu } from './MainMenu'
import { Footer } from './Footer'

export function AppLayout() {
    return (
        <>
            <div className="min-h-screen flex flex-col m-4">
                <MainMenu />
                <Outlet />
                <ScrollRestoration />
            </div>
            <Footer />
            <Toaster />
        </>
    )
}
