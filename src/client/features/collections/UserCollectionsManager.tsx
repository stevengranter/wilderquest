import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { useState } from 'react'
import CollectionsList from '@/features/collections/CollectionsList'
import TaxaList from '@/features/collections/TaxaList'
import { useCollections } from '@/features/collections/useCollections'

export default function UserCollectionsManager() {
    const { collections, isLoading, isError } = useCollections()
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (over) {
            console.log(`Dragging ${active.id} over ${over.id}`)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            console.log(`Dropped ${active.id} on ${over.id}`)
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
