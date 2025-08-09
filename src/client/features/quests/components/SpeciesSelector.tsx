import { useFormContext, useWatch } from 'react-hook-form'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/api/api'

export function SpeciesSelector({ selectedTaxa, onToggleTaxon }) {
    const { control } = useFormContext()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })
    const locationName = useWatch({ control, name: 'locationName' })
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)

    const {
        data: speciesCounts,
        isLoading,
        isError,
    } = useQuery<any[], Error>({
        queryKey: ['speciesCounts', lat, lon, page, perPage],
        queryFn: () =>
            getSpeciesCountsByGeoLocation(lat, lon, 10, page, perPage),
        enabled: !!lat && !!lon,
        keepPreviousData: true,
    })

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">
                Current Species ({selectedTaxa.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                {selectedTaxa.map((taxon) => (
                    <div key={taxon.id} className="flex flex-col gap-2">
                        <SpeciesCardWithObservations
                            species={taxon}
                            locationData={{
                                latitude: lat,
                                longitude: lon,
                                location_name: locationName,
                            }}
                        />
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                onToggleTaxon(taxon)
                            }}
                            variant="neutral"
                        >
                            Remove
                        </Button>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-semibold my-4">Add Species</h2>
            <div className="flex items-center space-x-2 mb-4">
                <label htmlFor="per-page">Results per page:</label>
                <Select onValueChange={(value) => setPerPage(Number(value))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading && <p>Loading species...</p>}
            {isError && <p>Error fetching species.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                {speciesCounts &&
                    speciesCounts.map((s) => {
                        const isAdded = selectedTaxa.some(
                            (t) => t.id === s.taxon.id,
                        )
                        return (
                            <div key={s.taxon.id} className="flex flex-col gap-2">
                                <SpeciesCardWithObservations
                                    species={s.taxon}
                                    locationData={{
                                        latitude: lat,
                                        longitude: lon,
                                        location_name: locationName,
                                    }}
                                />
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onToggleTaxon(s.taxon)
                                    }}
                                    variant={isAdded ? 'neutral' : 'default'}
                                    disabled={isAdded}
                                >
                                    {isAdded ? 'Added' : 'Add'}
                                </Button>
                            </div>
                        )
                    })}
            </div>
            <div className="flex justify-between mt-4">
                <Button
                    type="button"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span>Page {page}</span>
                <Button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10,
    page = 1,
    perPage = 10,
) {
    const response = await api.get(
        `/iNatAPI/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false&page=${page}&per_page=${perPage}`,
    )
    if (!response.data) {
        return []
    }
    return response.data.results
}