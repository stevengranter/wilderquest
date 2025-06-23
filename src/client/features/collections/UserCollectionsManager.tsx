import CollectionsList from '@/features/collections/CollectionsList'
import TaxaList from '@/features/collections/TaxaList'

export default function UserCollectionsManager() {
    return (
        <>
            <h2>⚛️ UserCollectionsManager</h2>
            <CollectionsList />
            <TaxaList />
        </>
    )
}
