// src/layouts/TabsLayout.tsx
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LocationIndicator from '@/components/location/LocationIndicator'

export function TabsLayout() {
    const navigate = useNavigate()
    const location = useLocation()

    const currentTab = location.pathname.match(/\/(explore|identify|locate)/)?.[1] || 'explore'

    const handleTabChange = (value: string) => {
        const searchParams = new URLSearchParams(location.search)
        navigate(`/${value}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
    }

    return (
        <>
            <LocationIndicator className='flex justify-end mb-2 text-xs' />
            <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='explore'>Explore</TabsTrigger>
                    <TabsTrigger value='identify'>Identify</TabsTrigger>
                    <TabsTrigger value='locate'>Locate</TabsTrigger>
                </TabsList>
                <Outlet />
            </Tabs>
        </>
    )
}
