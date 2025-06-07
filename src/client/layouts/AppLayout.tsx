'use client'

import ChatSidebar from '@/components/chat/ChatSidebar'
import SearchInterface from '@/components/search/Search'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppProvider } from '@/contexts/app-context'

export function AppLayout() {
	return (
		<AppProvider>
			<SidebarProvider defaultOpen={true}>
				<div className='flex flex-row'>
					<ChatSidebar />
					<SidebarInset className='p-6'>
						<SidebarTrigger className='mr-2' />
						<h1 className='text-2xl font-bold'>Dashboard</h1>

						<SearchInterface />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</AppProvider>
	)
}
