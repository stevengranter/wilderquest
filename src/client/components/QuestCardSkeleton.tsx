import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IoMdCompass } from 'react-icons/io'
import { MdLocationPin, MdOutlinePhotoSizeSelectActual } from 'react-icons/md'

const photoGrid = (number: number) => {
    const photos = [];
    for (let i = 0; i < number; i++) {
        photos.push(
            <Skeleton key={i} className="w-full h-full border-0 bg-gray-300 flex items-center justify-center rounded-none">
                <MdOutlinePhotoSizeSelectActual className="text-gray-200" size={50} />
            </Skeleton>
        );
    }
    return photos;
}

export function QuestCardSkeleton() {
    return (
        <Card className="m-0 p-0 shadow-0 overflow-hidden border rounded-xl gap-2 relative group bg-gray-100 border border-gray-300">
            <CardContent className="p-0 m-0 border-0 rounded-sm">
                <div className="grid grid-cols-3 grid-rows-2 relative w-full h-40 overflow-hidden border-0 bg-white">
                    {photoGrid(6)}
                </div>
            </CardContent>

            <CardContent className="px-4 pr-4 py-2 m-0 space-y-1 relative">
                <IoMdCompass className="z-5 absolute -top-2 -right-3 -translate-x-1/2 text-gray-200 opacity-20 w-28 h-28 pointer-events-none" />

                <div className="z-10 relative w-full">
                    <Skeleton className="h-6 w-3/4 animate-pulse mb-2 border-0 rounded-xl bg-gray-200" />
                </div>

                <div className="flex items-center justify-between z-10 relative w-full">
                    <Skeleton className="h-5 w-16 rounded-full animate-pulse border-0 bg-gray-200 rounded-xl" />
                </div>
            </CardContent>

            <CardFooter className="relative m-0 p-2 z-10">
                <div className="flex flex-row items-center justify-end relative z-10">
                    <MdLocationPin className="mr-1 text-gray-200" />
                    <Skeleton className="h-4 w-40 animate-pulse border-0 bg-gray-200 rounded-xl" />
                </div>
            </CardFooter>
        </Card>
    )
}