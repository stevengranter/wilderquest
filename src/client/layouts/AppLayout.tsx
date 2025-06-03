'use client'

import { useEffect } from 'react'
import { useAppContext } from '@/contexts/app-context'
import Dashboard from '../components/dashboard/Dashboard'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import ChatSidebar from '@/components/chat_sidebar/ChatSidebar'

const fetchCards = async () => {
    return ({ message: 'Not yet implemented' })
}

export function AppLayout() {
    const { setCards, setIsLoading } = useAppContext()

    // Initial data fetch
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true)
            try {
                const data = await fetchCards()
                setCards(data)
            } catch (error) {
                console.error('Failed to fetch initial data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadInitialData()
    }, [setCards, setIsLoading])

    return (
        <SidebarProvider defaultOpen={true}>
            <div className='flex h-screen'>
                <ChatSidebar />
                <SidebarInset>
                    <div className='p-4 h-full'>
                        <div className='flex items-center mb-4'>
                            <SidebarTrigger className='mr-2' />
                            <h1 className='text-2xl font-bold'>Dashboard</h1>
                        </div>
                        <Dashboard />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
