import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SearchForm from '@/components/SearchForm'
import ImageInput from '@/components/ImageInput'
import GeoLocation from '@/components/location/LocationInput'
import LocationIndicator from '@/components/location/LocationIndicator'
import { Outlet, useLocation, useNavigate } from 'react-router'

export default function RootLayout() {
    const navigate = useNavigate()
    const location = useLocation()

    // Extract the current tab by matching the base path
    const currentTab = location.pathname.match(/\/(explore|identify|locate)/)?.[1] || 'explore'

    const handleTabChange = (value: string) => {
        // Preserve any query parameters when changing tabs
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


export function ExploreTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Explore</CardTitle>
                <CardDescription>
                    Explore the world of nature
                </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
                <div className='grid gap-3'>
                    <SearchForm />
                </div>
            </CardContent>
            <CardFooter>
                <Button className='w-full' variant='neutral'>
                    Save changes
                </Button>
            </CardFooter>
        </Card>
    )
}

export function IdentifyTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Identify</CardTitle>
                <CardDescription>
                    Upload a photo to identify it
                </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
                <div className='grid gap-3'>
                    <Label htmlFor='tabs-photo-upload'>Upload photo</Label>
                    <ImageInput />
                </div>

            </CardContent>
            <CardFooter>
                <Button className='w-full' variant='neutral'>
                    Save password
                </Button>
            </CardFooter>
        </Card>
    )
}

export function LocateTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Locate</CardTitle>
                <CardDescription>
                    Set location here
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <GeoLocation />
            </CardFooter>
        </Card>
    )
}
