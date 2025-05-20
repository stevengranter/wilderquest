import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import SearchForm from '@/components/SearchForm'
import { Button } from '@/components/ui/button'

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
