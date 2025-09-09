'use client'

import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { SearchProvider } from '@/features/search/context/SearchContext'
import { SelectionProvider } from '@/components/contexts/SelectionContext'
import { MainMenu } from '@/components/layout/parts/MainMenu'
import { Footer } from '@/components/layout/parts/Footer'

export function AppLayout() {
    return (
        <>
            {/*<ScrollToTop />*/}
            {/*<SearchProvider>*/}
            <SelectionProvider>
                <div className="min-h-screen flex flex-col m-4">
                    <MainMenu />

                    {/*<UserToolbar />*/}
                    <Outlet />
                    <ScrollRestoration />
                </div>
                <Footer />
            </SelectionProvider>
            {/*</SearchProvider>*/}
            <Toaster />
        </>
    )
}
