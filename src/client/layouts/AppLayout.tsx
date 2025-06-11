'use client'


import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'

import AiAssistant from '@/components/chat/AiAssistant'
import { Outlet } from 'react-router'
import { SearchProvider } from '@/contexts/search/SearchContext'


export function AppLayout() {
    return (
        <SearchProvider>
        <SidebarProvider defaultOpen={true}>
            <div className='flex flex-row'>
                <AiAssistant />
                <SidebarInset className='p-6'>
                    <SidebarTrigger className='mr-2' />
                    <Outlet />
                </SidebarInset>
            </div>
        </SidebarProvider>
        </SearchProvider>
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
