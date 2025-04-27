// 📦 Packages
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import axios from 'axios'

// ⚛️ Components
import SearchAutoComplete from '@/components/SearchAutoComplete'
import { Card, CardContent, CardSection } from './ui/card'
import { Badge } from '@/components/ui/badge'

// 🛠️ Utils
import { cn } from '@/lib/utils'
import _ from 'lodash'
import fetchWikipediaContent from '@/utils/fetchWikipediaContent'
import ImageInput from '@/components/ImageInput'

// ⭐️ SearchForm component
export default function SearchForm() {
    const [selectedItemName, setSelectedItemName] = useState('')
    const [searchResults, setSearchResults] = useState<iNatTaxaResponse[]>([])

    // const [taxonId, setTaxonId] = useState<number | null>(null)

    async function handleSelect(item: iNatTaxaResponse) {
        setSelectedItemName(item.preferred_common_name || item.name)
        const result = await axios.get(`/api/iNatAPI/taxa/?taxon_id=${item.id}`)
        setSearchResults(result.data.results)
    }

    return (
        <>
            <SearchAutoComplete
                selectionHandler={handleSelect}
                selectedItemName={selectedItemName}
            />
            <SearchResults
                searchResults={searchResults}
                onSelect={handleSelect}
            />
            <ImageInput />
        </>
    )
}

// 🌱 SearchResults component
function SearchResults({
    searchResults,
    onSelect,
}: {
    searchResults: iNatTaxaResponse[]
    onSelect: (item: iNatTaxaResponse) => void
}) {
    return (
        <ul className="m-6 gap-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
            {searchResults.map((item) => (
                <TaxonCard item={item} key={item.id} onClick={onSelect} />
            ))}
        </ul>
    )
}

function TaxonCard({
    item,
    onClick,
}: {
    item: iNatTaxaResponse
    onClick?: (item: iNatTaxaResponse) => void
}) {
    const [wikiContent, setWikiContent] = useState<string | null>(null)
    const [selectedAncestorTaxon, setSelectedAncestorTaxon] = useState<
        number | null
    >(null)
    const [ancestors, setAncestors] = useState<iNatTaxaResponse[]>([])

    useEffect(() => {
        if (selectedAncestorTaxon) {
            console.log('selectedAncestorTaxon: ', selectedAncestorTaxon)
        }
    })

    async function fetchAncestorData(ancestorIds: number[]) {
        const result = await axios.get(
            `/api/iNatAPI/taxa/${ancestorIds.join()}`
        )
        console.log(result.data)
        setAncestors(result.data.results)
    }

    async function fetchWikipediaArticle() {
        if (item.wikipedia_url) {
            const title = item.wikipedia_url.split('/').pop() || item.name
            const content = await fetchWikipediaContent(title)
            setWikiContent(content)
        } else {
            setWikiContent(null)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
                default: { duration: 0.5 },
                rotate: { type: 'spring', duration: 0.4 },
                scale: { type: 'spring', duration: 0.4 },
            }}
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
        >
            <Card
                key={item.id}
                className={cn('p-0 m-0')}
                onClick={() => {
                    console.log(item)
                    if (onClick) {
                        onClick(item)
                    }
                }}
            >
                <CardSection>
                    {item.default_photo?.medium_url && (
                        <img
                            src={item.default_photo.medium_url}
                            alt={item.name}
                            className="w-full rounded-t-md object-cover aspect-square"
                        />
                    )}
                </CardSection>
                <CardContent className="p-4 pt-2">
                    <h3 className="font-bold text-xl">
                        {_.startCase(_.camelCase(item.preferred_common_name))}
                    </h3>
                    <h4 className="italic">{item.name}</h4>
                    <div>Taxon ID: {item.id}</div>
                    <div>
                        Observations: <Badge>{item.observations_count}</Badge>
                    </div>
                    <div>Rank: {item.rank}</div>
                    {onClick && (
                        <button
                            onClick={() => fetchAncestorData(item.ancestor_ids)}
                        >
                            View ancestors
                        </button>
                    )}

                    {ancestors &&
                        ancestors.length > 0 &&
                        ancestors.map((ancestor) => (
                            <button
                                onClick={() =>
                                    setSelectedAncestorTaxon(ancestor.id)
                                }
                            >
                                <li>
                                    {ancestor.rank}:{ancestor.name}
                                </li>
                            </button>
                        ))}
                </CardContent>
            </Card>
        </motion.div>
    )
}
