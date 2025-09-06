'use client'

import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui'
import { SearchProvider } from '@/features/search/context/SearchContext'
import { SelectionProvider } from '@/core/contexts/SelectionContext'
import { MainMenu } from '@/components/layout/MainMenu'

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
                        {/*<SidebarProvider defaultOpen={true}>*/}
                        {/*    <div className='flex flex-row'>*/}
                        {/*        /!*<AiAssistant />*!/*/}
                        {/*        <SidebarInset className='p-6'>*/}
                        {/*            <SidebarTrigger className='mr-2' />*/}
                        {/*            <Outlet />*/}
                        {/*        </SidebarInset>*/}
                        {/*    </div>*/}
                        {/*</SidebarProvider>*/}
                        {/*<SelectionDrawer />*/}
                    </div>
                </SelectionProvider>
            </SearchProvider>
            <Toaster />
        </>
    )
}

// export function AppLayout() {
// 	return (
// 		<AppProvider>
//             <SearchProvider>
// 			<SidebarProvider defaultOpen={true}>
// 				<div className='flex flex-row'>
// 					<AiAssistant />
// 					<SidebarInset className='p-6'>
// 						<SidebarTrigger className='mr-2' />
// 						<h1 className='text-2xl font-bold'>Dashboard</h1>
// 						<SearchInterface />
// 					</SidebarInset>
// 				</div>
// 			</SidebarProvider>
//             </SearchProvider>
// 		</AppProvider>
// 	)
// }
