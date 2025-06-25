import Draggable from '@/components/ui/draggable'
import { Collection } from './collection.types'

export default function TaxaList({
    collections,
}: {
    collections: Collection[]
}) {
    // Build map: taxon_id => Set of collection names (or ids)
    const taxonIdToCollections = new Map<number, Set<string>>()

    collections.forEach((collection) => {
        collection.taxon_ids?.forEach((taxon_id) => {
            if (!taxonIdToCollections.has(taxon_id)) {
                taxonIdToCollections.set(taxon_id, new Set())
            }
            taxonIdToCollections.get(taxon_id)?.add(collection.name)
        })
    })

    const uniqueTaxonIds = Array.from(taxonIdToCollections.keys()).sort()

    return (
        <>
            <h2>⚛️ TaxaList</h2>
            <p>Taxon IDs (with collections):</p>
            <ul className="flex flex-wrap gap-2 p-0">
                {uniqueTaxonIds.map((taxon_id) => (
                    <Draggable
                        key={taxon_id}
                        uniqueId={`taxon-${taxon_id}`}
                        className="w-max"
                    >
                        <li className="border border-red-200 px-2 py-1 rounded w-max list-none">
                            {taxon_id} —{' '}
                            <em>
                                {Array.from(
                                    taxonIdToCollections.get(taxon_id)!
                                ).join(', ')}
                            </em>
                        </li>
                    </Draggable>
                ))}
            </ul>
        </>
    )
}
