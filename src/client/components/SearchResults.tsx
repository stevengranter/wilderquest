import TaxonCard from '@/components/TaxonCard'
import { useAppContext } from '@/contexts/app-context'
import { useEffect } from 'react'

export default function SearchResults({
    searchResults,
    onSelect,
}: {
    searchResults: iNatTaxaResult[]
    onSelect: (item: iNatTaxaResult) => void
}) {
    const { cards, setCards } = useAppContext()

    useEffect(() => {
        console.log(cards)
    }, [cards])

    useEffect(() => {
        const simplifiedSearchResults = searchResults.map((item) => ({
            title: item.name,
            id: item.id.toString(),
            description: '',
            createdAt: '',
            category: 'iNat card',
        }))
        setCards(simplifiedSearchResults)
    }, [searchResults]) // removed setCards from dependencies

    return (
        <ul className='m-6 gap-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
            {searchResults.map((item) => (
                <TaxonCard item={item} key={item.id} onClick={onSelect} />
            ))}
        </ul>
    )
}
