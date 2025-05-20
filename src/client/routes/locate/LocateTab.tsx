import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import GeoLocation from '@/components/location/LocationInput'

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
