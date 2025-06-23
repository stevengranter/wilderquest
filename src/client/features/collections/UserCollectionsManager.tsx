import { useState } from 'react'
import CollectionsList from '@/features/collections/CollectionsList'
import TaxaList from '@/features/collections/TaxaList'
import { useCollections } from '@/features/collections/useCollections'

export default function UserCollectionsManager() {
    const { collections, isLoading, isError } = useCollections()
    return (
        <>
            <h2>⚛️ UserCollectionsManager</h2>
            <CollectionsList
                collections={collections}
                isError={isError}
                isLoading={isLoading}
            />
            <TaxaList collections={collections} />
        </>
    )
}
