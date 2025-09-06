import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LocationIndicator from '@/components/location/LocationIndicator'
import { Outlet, useLocation, useNavigate } from 'react-router'

export default function RootLayout() {
    const navigate = useNavigate()
    const location = useLocation()

    // Extract the current tab by matching the base path
    const currentTab =
        location.pathname.match(/\/(explore|identify|locate)/)?.[1] || 'explore'

    const handleTabChange = (value: string) => {
        // Preserve any query parameters when changing tabs
        const searchParams = new URLSearchParams(location.search)
        navigate(
            `/${value}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
        )
    }

    return (
        <div>
            <LocationIndicator className="flex justify-end mb-2 text-xs" />
            <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="explore">Explore</TabsTrigger>
                    <TabsTrigger value="identify">Identify</TabsTrigger>
                    <TabsTrigger value="locate">Locate</TabsTrigger>
                </TabsList>
                <Outlet />
            </Tabs>
        </div>
    )
}
