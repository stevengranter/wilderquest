import axios from 'axios'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

async function fetchPlacesAutocomplete(query: string) {
    if (query.length < 3) {
        console.log('too short')
        return []
    }
    console.log(query)
    const response = await axios.get(
        `/api/iNatAPI/places/autocomplete?q=${query}`,
    )
    console.log(response.data)
    if (response.data.results.length > 0) {
        return response.data.results
    } else {
        console.log('no results')
    }
}

export function PlaceFinder() {
    const [query, setQuery] = useState('')
    const debouncedQuery = useDebounce(query, 500)
    const [places, setPlaces] = useState([])

    useEffect(() => {
        if (debouncedQuery) {
            fetchPlacesAutocomplete(debouncedQuery).then((response) => {
                console.log(response)
                setPlaces(response)
            })
        }
    }, [debouncedQuery])

    useEffect(() => {
        if (places.length > 0) {
            console.log(places)
        }
    }, [places])

    return (
        <div>
            <Input type="text" onChange={(e) => setQuery(e.target.value)} />
        </div>
    )
}
