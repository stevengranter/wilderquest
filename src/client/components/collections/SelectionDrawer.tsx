import cx from 'clsx'
import { useSelectionContext } from '@/contexts/selection/SelectionContext'
import { useEffect, useMemo, useState } from 'react'
import { Collection } from '../../../types/types'
import { useReward } from 'react-rewards'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useSearchContext } from '@/contexts/search/SearchContext'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { INatResult, INatTaxon } from '../../../shared/types/iNatTypes'
import { fetchINaturalistData } from '@/components/search/fetchINaturalistData'

// Assuming SearchCategory is defined elsewhere, like in SearchCategorySelect

type CollectionsDrawerProps = {
    isVisible?: boolean
}

export default function SelectionDrawer({ isVisible }: CollectionsDrawerProps) {
    const { isSelectionMode } = useSelectionContext()

    return (
        <div
            className={cx(
                'fixed bottom-0 left-0 right-0 p-4 flex justify-between items-center',
                'bg-main',
                {
                    hidden: !isSelectionMode, // Hide when not visible
                    'transition-transform duration-300 ease-out': true,
                }
            )}
        >
            <SelectedItemsList className="flex flex-col" />
            <CollectionPicker />
        </div>
    )
}

function CollectionPicker() {
    const [collections, setCollections] = useState<Collection[]>([])
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null)
    const [currentEmoji, setCurrentEmoji] = useState('🙌')

    const { reward, isAnimating } = useReward('rewardId', 'emoji', {
        emoji: [currentEmoji],
        elementCount: 30,
        spread: 60,
        lifetime: 100,
    })

    useEffect(() => {
        api.get(`/collections/mine`).then((res) => setCollections(res.data))
    }, [])

    useEffect(() => {
        if (selectedCollection?.emoji) {
            setCurrentEmoji(selectedCollection.emoji)
        }
    }, [selectedCollection])

    const handleAddAllToCollection = () => {
        requestAnimationFrame(() => {
            reward()
        })
    }

    return (
        <>
            <div id="rewardId" className="ml-20"></div>
            <div className="flex flex-col">
                <CollectionSelectDropdown
                    collections={collections}
                    setCollections={setCollections}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                />
                <Button
                    disabled={isAnimating}
                    onClick={handleAddAllToCollection}
                >
                    Add all to collection
                </Button>
            </div>
        </>
    )
}

function CollectionSelectDropdown({
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
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
'         '     {collections.map((collection) => (
   '                <Se'ectItem value={collection.name} key={collection.id}>
                        {collection.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

function SelectedItemsList({ className }: { className?: string }) {
    const { results } = useSearchContext() // `results` is now an object: { observations: ..., species: ... }
    const { selectedIds } = useSelectionContext()

    // State to store data fetched for selected IDs not found in `results`
    const [fetchedSelectedItems, setFetchedSelectedItems] = useState<
        INatResult[]
    >([])

    const selectedResults = useMemo(() => {
        // Collect all available results from both species and observations
        const allAvailableResults: INatResult[] = []

        if (results.species?.results) {
            allAvailableResults.push(...results.species.results)
        }
        if (results.observations?.results) {
            allAvailableResults.push(...results.observations.results)
        }

        // Filter available results based on selectedIds
        const resultsFoundInContext = allAvailableResults.filter((result) =>
            selectedIds.includes(result.id.toString()),
        )

        // Combine with explicitly fetched items, ensuring no duplicates
        const combinedResults = [...resultsFoundInContext]
        fetchedSelectedItems.forEach((fetchedItem) => {
            if (!combinedResults.some((item) => item.id === fetchedItem.id)) {
                combinedResults.push(fetchedItem)
            }
        })

        return combinedResults
    }, [selectedIds, results, fetchedSelectedItems])

    useEffect(() => {
        console.log('Selected IDs:', selectedIds)
        console.log('Context Results:', results) // Log the full results object
        console.log('Fetched Selected Items:', fetchedSelectedItems)
    }, [selectedIds, results, fetchedSelectedItems])

    // Effect to fetch data for selected IDs not present in `results`
    useEffect(() => {
        if (!selectedIds.length) {
            setFetchedSelectedItems([]) // Clear fetched items if no selected IDs
            return
        }

        // Gather all IDs currently present in context results
        const currentResultIds = new Set<string>()
        if (results.species?.results) {
            results.species.results.forEach((result) =>
                currentResultIds.add(result.id.toString()),
            )
        }
        if (results.observations?.results) {
            results.observations.results.forEach((result) =>
                currentResultIds.add(result.id.toString()),
            )
        }

        const missingIds = selectedIds.filter((id) => !currentResultIds.has(id))

        if (missingIds.length > 0) {
            const fetchMissingData = async () => {
                const fetchedDataPromises = missingIds.map(async (id) => {
                    try {
                        // **IMPORTANT:** You need a strategy to determine if 'id' is for a 'species' or 'observation'.
                        // For this example, I'm assuming 'species' if no other info.
                        // If your selectedIds can come from either, you'll need to store more context
                        // with each selectedId (e.g., { id: '123', category: 'species' }).
                        const data = await fetchINaturalistData(
                            'species', // Defaulting to 'species'. Adjust as needed.
                            '',
                            id,
                        )
                        // Ensure data has a 'results' array and take the first item
                        if ('results' in data && data.results.length > 0) {
                            // Check if it's a taxon or observation result to cast correctly
                            if (
                                data.results[0].hasOwnProperty(
                                    'scientific_name',
                                )
                            ) {
                                // Simple check for taxon
                                return data.results[0] as INatTaxon
                            } else {
                                // Assume it's an observation result if not a taxon
                                return data.results[0] as INatResult // Or a specific observation result type
                            }
                        }
                        return null
                    } catch (error) {
                        console.error(
                            `Failed to fetch data for ID ${id}:`,
                            error,
                        )
                        return null
                    }
                })

                const resolvedFetchedData = (
                    await Promise.all(fetchedDataPromises)
                ).filter(Boolean) as INatResult[] // Cast to INatResult[]
                setFetchedSelectedItems((prev) => {
                    const newItems = resolvedFetchedData.filter(
                        (newItem) =>
                            !prev.some(
                                (existingItem) => existingItem.id === newItem.id,
                            ),
                    )
                    return [...prev, ...newItems]
                })
            }
            fetchMissingData()
        }
    }, [selectedIds, results]) // Re-run when selectedIds or results change

    return (
        <div className={className}>
            <h3 className='dark:text-main-foreground'>Selected items:</h3>
            <div className='base:flex base:flex-row '>
                {selectedResults.length > 0 ? (
                    selectedResults.map((result) => (
                        <MiniCard
                            key={result.id} // Important for list rendering
                            data={result}
                            className='w-20'
                        />
                    ))
                ) : (
                    <p className='text-gray-500'>No items selected.</p>
                )}
            </div>
        </div>
    )
}

function MiniCard({
                      data,
                      className,
                  }: {
    data?: INatResult
    className?: string
}) {
    // Type data as INatResult
    if (!data) return null // Handle cases where data might be undefined/null

    // Determine which photo to use based on the data type
    const imageUrl =
        data.default_photo?.medium_url ||
        (data as any).photos?.[0]?.url || // For observations
        '/path/to/placeholder.jpg' // Fallback placeholder

    const altText =
        data.name || (data as any).species_guess || 'iNaturalist item'

    return (
        <Dialog>
            <DialogTrigger>
                <img
                    src={imageUrl}
                    alt={altText}
                    className="mx-3 ml-0 my-2 mr-3 h-8 sm:h-12 md:h-16
                    object-cover aspect-square rounded-lg
                    border-black border-2 shadow-shadow
                    "
                />
            </DialogTrigger>
            <DialogContent>
                {/* Conditionally render SpeciesCard or another card based on data type */}
                {'scientific_name' in data ? ( // Simple check if it's a taxon
                    <SpeciesCard
                        species={data as INatTaxon}
                        isSelectable={false}
                    />
                ) : (
                    // You would create an <ObservationCard> component here
                    // For now, just display data as JSON or a generic message
                    <div>
                        <h4>Observation Details</h4>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
