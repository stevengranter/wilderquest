import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import ImageInput from '@/components/ImageInput'
import { Button } from '@/components/ui/button'

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
