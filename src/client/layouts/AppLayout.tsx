'use client'


import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar'

import AiAssistant from '@/components/chat/aiAssistant'
import { Outlet } from 'react-router'
import SelectionDrawer from '@/components/collections/SelectionDrawer'
import { SearchProvider } from '@/contexts/search/SearchContext'
import { SelectionProvider } from '@/contexts/selection/SelectionContext'


export function AppLayout() {

    return (
        <SearchProvider>
            <SelectionProvider>
            <SidebarProvider defaultOpen={true}>
                <div className='flex flex-row'>
                    <AiAssistant />
                    <SidebarInset className='p-6'>
                        <SidebarTrigger className='mr-2' />
                        <Outlet />
                    </SidebarInset>
                </div>
            </SidebarProvider>
            <SelectionDrawer />
            </SelectionProvider>
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
