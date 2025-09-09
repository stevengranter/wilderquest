'use client'

import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui'
import { SearchProvider } from '@/features/search/context/SearchContext'
import { SelectionProvider } from '@/core/contexts/SelectionContext'
import { MainMenu } from '@/components/layout/MainMenu'
import { Footer } from '@/components/layout/Footer'

export function AppLayout() {
    return (
        <>
            {/*<ScrollToTop />*/}
            <SearchProvider>
                <SelectionProvider>
                    <div className="min-h-screen flex flex-col m-4">
                        <MainMenu />

                        {/*<UserToolbar />*/}
                        <Outlet />
                        <ScrollRestoration />
                    </div>
                    <Footer />
                </SelectionProvider>
            </SearchProvider>
            <Toaster />
        </>
    )
}
