import cx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useReward } from 'react-rewards'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSearchContext } from '@/contexts/search/SearchContext'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import MiniCard from '@/features/collections/MiniCard'
import { useCollections } from '@/features/collections/useCollections'
import { Collection } from '../../../types/types'

type CollectionsDrawerProps = {
    isVisible?: boolean
}

export default function SelectionDrawer({ isVisible }: CollectionsDrawerProps) {
    const { isSelectionMode } = useSelectionContext()

    return (
        <div
            className={cx(
                'fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center z-100',
                'bg-main',
                {
                    hidden: !isSelectionMode,
                    'transition-transform duration-300 ease-out': true,
                }
            )}
        >
            <SelectionToolbar className='flex flex-col' />
            <CollectionPicker />
        </div>
    )
}

function CollectionPicker() {
    const { collections, updateCollectionTaxa } = useCollections()
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null)
    const [currentEmoji, setCurrentEmoji] = useState('🙌')
    const { selectedIds } = useSelectionContext()

    const { reward, isAnimating } = useReward('rewardId', 'emoji', {
        emoji: [currentEmoji],
        elementCount: 30,
        spread: 60,
        lifetime: 100,
    })

    useEffect(() => {
        if (selectedCollection?.emoji) {
            setCurrentEmoji(selectedCollection.emoji)
        }
    }, [selectedCollection])

    const handleAddAllToCollection = async () => {
        if (!selectedCollection) {
            toast.error('Please select a collection first')
            return
        }

        // Convert selectedIds strings to numbers and filter out any invalid conversions
        const taxonIds = selectedIds
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id))

        // Get current taxon_ids from selected collection and merge with new ones
        const currentTaxonIds = selectedCollection.taxon_ids || []
        const uniqueTaxonIds = [...new Set([...currentTaxonIds, ...taxonIds])]

        const result = await updateCollectionTaxa(
            selectedCollection.id,
            uniqueTaxonIds,
        )

        if (result.success) {
            reward()
            toast.success(
                `Added ${taxonIds.length} items to "${selectedCollection.name}"`,
            )
        } else {
            toast.error(`Failed to update collection: ${result.error}`)
        }
    }

    return (
        <>
            <div id='rewardId' className='ml-20'></div>
            <div className='flex flex-col'>
                <CollectionSelect
                    collections={collections}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                />
                <Button
                    disabled={
                        isAnimating ||
                        !selectedCollection ||
                        selectedIds.length === 0
                    }
                    onClick={handleAddAllToCollection}
                >
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
    selectedCollection: Collection | null
    setSelectedCollection: (collection: Collection | null) => void
}) {
    return (
        <Select
            onValueChange={(value) => {
                const collection = collections.find((c) => c.name === value)
                setSelectedCollection(collection ?? null)
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
    const { selectedIds, setSelectedIds, removeIdFromSelection } =
        useSelectionContext()

    const selectedResults = useMemo(() => {
        if (!results) return []
        const resultsArray = results.results.filter((result) =>
            selectedIds.includes(result.id.toString()),
        )
        return resultsArray
    }, [selectedIds, results])

    return (
        <div className={className}>
            <h3 className='dark:text-main-foreground'>Selected items:</h3>
            <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12'>
                {selectedResults.map((result) => (
                    <MiniCard key={result.id} data={result} className='w-20' />
                ))}
            </div>
        </div>
    )
}
