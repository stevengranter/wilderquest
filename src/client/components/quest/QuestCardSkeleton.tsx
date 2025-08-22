import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function QuestCardSkeleton() {
    return (
        <Card className="m-0 p-0 shadow-0 overflow-hidden bg-white border rounded-2xl gap-2">
            <CardContent className="p-0 m-0">
                <Skeleton className="w-full h-[200px] animate-pulse" />
            </CardContent>
            <CardContent className="px-4 py-2 m-0 space-y-1">
                <Skeleton className="h-6 w-3/4 animate-pulse" />
                <Skeleton className="h-4 w-1/2 animate-pulse" />
            </CardContent>
            <CardFooter className="m-0 p-2 bg-gray-50">
                <Skeleton className="h-4 w-1/4 animate-pulse" />
            </CardFooter>
        </Card>
    );
}
