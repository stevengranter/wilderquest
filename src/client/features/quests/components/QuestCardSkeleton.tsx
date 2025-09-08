import { Card, CardContent, CardFooter } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { IoMdCompass } from 'react-icons/io'
import { MdLocationPin } from 'react-icons/md'

export function QuestCardSkeleton() {
    return (
        <Card className="m-0 p-0 shadow-0  overflow-hidden border rounded-xl gap-2 relative group bg-orange-100 border-1 border-orange-300">

            <CardContent className="p-0 m-0 border-0 rounded-sm ">
                <div className="relative w-full h-40 overflow-hidden border-0 bg-white">
                    <Skeleton className="w-full h-full border-0 bg-orange-200" />
                </div>
            </CardContent>

            <CardContent className="px-4 pr-4 py-2 m-0 space-y-1 relative">
                <IoMdCompass className="z-5 absolute -top-2 -right-3 -translate-x-1/2 text-orange-200 opacity-20 w-28 h-28 pointer-events-none" />

                <div className="z-10 relative w-full">
                    <Skeleton className="h-6 w-3/4 animate-pulse mb-2 border-0 rounded-xl bg-orange-200 " />
                </div>

                <div className="flex items-center justify-between z-10 relative w-full">
                    <Skeleton className="h-5 w-16 rounded-full animate-pulse border-0 bg-orange-200 rounded-xl " />
                </div>
            </CardContent>

            <CardFooter className="relative m-0 p-2 z-10">
                <div className="flex flex-row items-center justify-right relative z-10">
                    <MdLocationPin className="mr-1 text-orange-200" />
                    <Skeleton className="h-4 w-40 animate-pulse border-0 bg-orange-200 rounded-xl " />
                </div>
            </CardFooter>
        </Card>
    )
}
