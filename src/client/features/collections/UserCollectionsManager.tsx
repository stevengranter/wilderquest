import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import CollectionsList from '@/features/collections/CollectionsList'
import TaxaList from '@/features/collections/TaxaList'
import { useCollections } from '@/features/collections/useCollections'

export default function UserCollectionsManager() {
    const { collections, updateCollectionTaxa, isLoading, isError } =
        useCollections()

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (over) {
            console.log(`Dragging ${active.id} over ${over.id}`)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const overCollectionId = Number(
                over.id.toString().replace('collection-', '')
            )
            const activeTaxonId = Number(
                active.id.toString().replace('taxon-', '')
            )

            const targetCollection = collections.find(
                (collection) => collection.id === overCollectionId
            )

            if (!targetCollection) return

            const currentTaxaIds = targetCollection.taxon_ids || []

            // Check if taxon already exists
            if (currentTaxaIds.includes(activeTaxonId)) {
                toast.info('Taxon is already in the collection')
                return
            }

            const updatedTaxaIds = [...currentTaxaIds, activeTaxonId]

            const result = await updateCollectionTaxa(
                overCollectionId,
                updatedTaxaIds
            )

            if (result.success) {
                toast.success(
                    `Added taxon ${activeTaxonId} to "${targetCollection.name}"`
                )
            } else {
                toast.error(`Failed to update collection: ${result.error}`)
            }
        }
    }

    return (
        <>
            <h2>⚛️ UserCollectionsManager</h2>
            <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <CollectionsList
                    collections={collections}
                    isError={isError}
                    isLoading={isLoading}
                />
                <TaxaList collections={collections} />
            </DndContext>
        </>
    )
}
