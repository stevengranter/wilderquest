'use client'

import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { SearchProvider } from '@/contexts/search/SearchContext'
import { SelectionProvider } from '@/contexts/selection/SelectionContext'
import UserToolbar from '@/features/login/UserToolbar'

export function AppLayout() {
    return (
        <>
            <SearchProvider>
                <SelectionProvider>
                    <UserToolbar />
                    <Outlet />
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
