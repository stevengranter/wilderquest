import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useSearchContext } from '@/contexts/search/SearchContext'

export default function MiniCard({
                                     data,
                                     className,
                                 }: {
    data?: any
    className?: string
}) {
    return (
        <Dialog>
            <DialogTrigger>
                <img
                    src={data?.default_photo?.medium_url}
                    alt={data?.name}
                    className='mx-3 ml-0 my-2 mr-3 h-8 sm:h-10  md:h-14
                    object-cover aspect-square rounded-lg
                    border-black border-2 shadow-shadow
                    '
                />
            </DialogTrigger>
            <DialogContent>
                <SpeciesCard species={data} isSelectable={false} />
            </DialogContent>
        </Dialog>
    )
}
