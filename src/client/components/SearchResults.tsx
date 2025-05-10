import TaxonCard from '@/components/TaxonCard'

export default function SearchResults({
    searchResults,
    onSelect,
}: {
    searchResults: iNatTaxaResponse[]
    onSelect: (item: iNatTaxaResponse) => void
}) {
    return (
        <ul className="m-6 gap-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
            {searchResults.map((item) => (
                <TaxonCard item={item} key={item.id} onClick={onSelect} />
            ))}
        </ul>
    )
}
