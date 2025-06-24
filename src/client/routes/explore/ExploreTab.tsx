import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SearchInterface from '@/components/search/Search'
import { SearchProvider } from '@/contexts/search/SearchContext'

export function ExploreTab() {
    return (
        <Card>
            <CardHeader>
                {/*<CardTitle>Explore</CardTitle>*/}
                {/*<CardDescription>*/}
                {/*    Explore the world of nature*/}
                {/*</CardDescription>*/}
            </CardHeader>
            <CardContent className='grid gap-6'>
                <div className='grid gap-3'>

                    <SearchInterface />

                </div>
            </CardContent>
            {/*<CardFooter>*/}
            {/*    <Button className='w-full' variant='neutral'>*/}
            {/*        Save changes*/}
            {/*    </Button>*/}
            {/*</CardFooter>*/}
        </Card>
    )
}
