import cx from 'clsx'
import CollectionsList from '@/components/collections/CollectionsList'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import { useEffect, useMemo, useState } from 'react'
import { Collection } from '../../../types/types'
import { useReward } from 'react-rewards'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // You might need to install 'clsx' or 'cx' if you haven't already

type CollectionsDrawerProps = {
    isVisible?: boolean;
};

export default function SelectionDrawer({ isVisible }: CollectionsDrawerProps) {
    const { isSelectionMode } = useSelectionContext()

    return (
        <div
            className={cx(
                'fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center',
                'bg-main',
                {
                    'hidden': !isSelectionMode, // Hide when not visible
                    // Add other visibility/animation classes here if needed, e.g., for transitions
                    // 'translate-y-full': !isSelectionMode, // To slide out of view
                    // 'translate-y-0': isSelectionMode,    // To slide into view
                    'transition-transform duration-300 ease-out': true, // For the transition effect
                },
            )}
        >
            <SelectionToolbar className='flex flex-col' />
            <CollectionPicker />
        </div>
    )
}




function CollectionPicker() {
    const [collections, setCollections] = useState<Collection[]>([])
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
    const [currentEmoji, setCurrentEmoji] = useState('🙌')

    const { reward, isAnimating } = useReward('rewardId', 'emoji', {
        emoji: [currentEmoji],
        // rotate: false,
        elementCount: 30,
        spread: 60,
        lifetime: 100,
    })

    useEffect(() => {
        api.get(`/collections/mine`).then(res => setCollections(res.data))
    }, [])

    useEffect(() => {
        if (selectedCollection?.emoji) {
            setCurrentEmoji(selectedCollection.emoji)
        }
    }, [selectedCollection])

    const handleAddAllToCollection = () => {
        // console.log('Selected collection: ', selectedCollection)

        // Delay to next frame so layout settles before animation starts
        requestAnimationFrame(() => {
            reward()
        })
    }

    return (
        <>

            <div id='rewardId' className='ml-20'></div>
            <div className='flex flex-col'>
            <CollectionSelect
                collections={collections}
                setCollections={setCollections}
                selectedCollection={selectedCollection}
                setSelectedCollection={setSelectedCollection}
            />
            <Button disabled={isAnimating} onClick={handleAddAllToCollection}>
                Add all to collection
            </Button>
            </div>

        </>
    )
}


function CollectionSelect({
                              collections,
                              selectedCollection,
                              setSelectedCollection,
                          }: {
    collections: Collection[]
    setCollections: (collections: Collection[]) => void
    selectedCollection: Collection | null
    setSelectedCollection: (collection: Collection | null) => void
}) {
    return (
        <Select
            onValueChange={(value) => {
                const collection = collections.find((c) => c.name === value)
                setSelectedCollection(collection ?? null)
                console.log('Selected collection: ', collection)
            }}
            value={selectedCollection?.name ?? ''}
        >
            <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select a collection' />
            </SelectTrigger>
            <SelectContent>
                {collections.map((collection) => (
                    <SelectItem value={collection.name} key={collection.id}>
                        {collection.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}


function SelectionToolbar({ className }: { className?: string }) {
    const { results } = useSearchContext()
    const { selectedIds, setSelectedIds, removeIdFromSelection } = useSelectionContext()

    const selectedResults = useMemo(() => {
        if (!results) return []
        const resultsArray = results.results.filter(result => selectedIds.includes(result.id.toString()))
        return resultsArray
    }, [selectedIds, results])

    useEffect(() => {
        console.log('Selected IDs:', selectedIds)
        console.log('Results:', results)
        console.log(results)
    }, [selectedIds])


    function handleAddAllToCollection() {
        console.log('handleAddAllToCollection not yet implemented')
    }

    return (<div className={className}>

            <h3 className='dark:text-main-foreground'>Selected items:</h3>
            <div className='grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12'>{selectedResults.map(result => <MiniCard
                data={result}
                className='w-20' />)}</div>
        </div>

    )
}

import { useSearchContext } from '@/contexts/search/SearchContext'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { SpeciesCard } from '@/components/cards/SpeciesCard'

function MiniCard({ data, className }: { data?: any, className?: string }) {
    return (
        <Dialog>
            <DialogTrigger>
                <img
                    src={data?.default_photo?.medium_url}
                    alt={data?.name}
                    className='mx-3 my-1 sm:h-10  md:h-15
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