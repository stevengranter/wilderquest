// 📦 Packages
import {useState} from 'react'
import axios from 'axios'

// ⚛️ Components
import SearchAutoComplete from '@/components/SearchAutoComplete'
import {Card, CardContent, CardSection} from './ui/card'
import {Badge} from '@/components/ui/badge'

// 🛠️ Utils
import {cn} from '@/lib/utils'
import _ from 'lodash'

// ⭐️ SearchForm component
export default function SearchForm() {
    const [searchResults, setSearchResults] = useState<iNatTaxaResponse[]>([])

    async function handleSelect(item: SuggestionItem) {
        const result = await axios.get(
            `/api/iNatAPI/taxa/?taxon_id=${item.id}`
        )
        setSearchResults(result.data.results)
    }

    return (
        <>
            <SearchAutoComplete selectionHandler={handleSelect}/>
            <SearchResults searchResults={searchResults}/>
        </>
    )
}

// 🌱 SearchResults component
function SearchResults({
                           searchResults,
                       }: {
    searchResults: iNatTaxaResponse[]
}) {
    return (
        <ul
            // key='grid'
            // initial={{opacity: 0}}
            // animate={{opacity: 1}}
            // exit={{opacity: 0}}
            className='m-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 '
        >
            {searchResults.map((item) => (
                <TaxonCard item={item} key={item.id}/>
            ))}
        </ul>
    )
}

function TaxonCard({item}: { item: iNatTaxaResponse }) {
    return (
        <Card
            key={item.id}
            className={cn(
                'p-0 m-0 cursor-pointer transition-all duration-300 hover:scale-105 hover:rotate-2'
            )}
            onClick={() => {
                console.log(item)
            }}
            // onClick={async () => {
            //         if (item.wikipedia_url) {
            //         const title = item.wikipedia_url.split("/").pop() || item.name;
            //         const content = await fetchWikipediaContent(title);
            //         setWikiContent(content);
            //     } else {
            //         setWikiContent(null);
            //     }
            // }}
        >
            <CardSection>
                {item.default_photo?.medium_url && (
                    <img
                        src={item.default_photo.medium_url}
                        alt={item.name}
                        className='w-full rounded-t-md object-cover aspect-square'
                    />
                )}
            </CardSection>
            <CardContent className='p-4 pt-2'>
                <h3 className='font-bold text-xl'>
                    {_.startCase(_.camelCase(item.preferred_common_name))}
                </h3>
                <h4 className='italic'>{item.name}</h4>
                <div>Taxon ID: {item.id}</div>
                <div>
                    Observations: <Badge>{item.observations_count}</Badge>
                </div>
                <div>
                    Rank: {item.rank}
                </div>
                <div>
                    Ancestors: {item.ancestor_ids.map((id) => <Badge key={id}>{id}</Badge>)}
                </div>
            </CardContent>
        </Card>
    )
}
