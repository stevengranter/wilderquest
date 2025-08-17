import { useFormContext, useWatch } from 'react-hook-form'
import React, { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveSpeciesGrid } from '@/features/quests/components/ResponsiveSpeciesThumbnail'
import { useSpeciesAddTrigger } from './SpeciesAnimationProvider'
import api from '@/api/api'
import type { INatTaxon } from '@shared/types/iNatTypes'

interface SpeciesSelectorProps {
    selectedTaxa: INatTaxon[]
    onToggleTaxon: (taxon: INatTaxon) => void
}

interface SpeciesCountResult {
    taxon: INatTaxon
    count: number
}

export function SpeciesSelector({
                                    selectedTaxa,
                                    onToggleTaxon,
                                }: SpeciesSelectorProps) {
    const { control } = useFormContext()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })
    const locationName = useWatch({ control, name: 'locationName' })
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const { triggerAnimation } = useSpeciesAddTrigger()
    const speciesCardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

    const {
        data: speciesCounts,
        isLoading,
        isError,
    } = useQuery<SpeciesCountResult[], Error>({
        queryKey: [
            'speciesCounts',
            lat,
            lon,
            page,
            perPage,
            selectedTaxa.map((t) => t.id).sort().join(','),
        ],
        queryFn: () =>
            getSpeciesCountsByGeoLocation(lat, lon, 10, page, perPage),
        enabled: !!lat && !!lon,
        staleTime: 0,
        placeholderData: (previousData) => previousData,
    })

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left Column - Current Species */}
            <div className="flex flex-col lg:col-span-1">
                <ResponsiveSpeciesGrid
                    species={selectedTaxa}
                    onRemove={(species) => onToggleTaxon(species)}
                    locationData={{
                        latitude: lat,
                        longitude: lon,
                        location_name: locationName,
                    }}
                    showObservationsModal={true}
                    maxHeight="max-h-[70vh]"
                />
            </div>

            {/* Right Column - Add Species */}
            <div className="flex flex-col lg:col-span-3">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Add Species</h2>
                    <div className="flex items-center space-x-2 mb-4">
                        <label
                            htmlFor="per-page"
                            className="text-sm text-gray-600"
                        >
                            Results per page:
                        </label>
                        <Select
                            onValueChange={(value) => setPerPage(Number(value))}
                        >
                            <SelectTrigger className="w-[120px]">
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
                </div>

                {isLoading && (
                    <p className="text-center text-gray-500">
                        Loading species...
                    </p>
                )}
                {isError && (
                    <p className="text-center text-red-500">
                        Error fetching species.
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start max-h-[70vh] overflow-y-auto">
                    {speciesCounts?.map((s) => {
                        const isAdded = selectedTaxa.some((t) => t.id === s.taxon.id)
                        const buttonKey = `${s.taxon.id}-${isAdded ? 'added' : 'not-added'}`

                        return (
                            <div
                                key={buttonKey}
                                className="flex flex-col gap-2 h-fit"
                                ref={(el) => {
                                    if (el) {
                                        speciesCardRefs.current.set(s.taxon.id, el)
                                    }
                                }}
                                data-species-card
                            >
                                <SpeciesCardWithObservations
                                    species={s.taxon}
                                    locationData={{
                                        latitude: lat,
                                        longitude: lon,
                                        location_name: locationName,
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        if (!isAdded) {
                                            const cardElement =
                                                speciesCardRefs.current.get(s.taxon.id)
                                            if (cardElement) {
                                                triggerAnimation(s.taxon, cardElement)
                                            }
                                        }
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

                <div className="flex justify-between mt-4 pt-4 border-t">
                    <Button
                        type="button"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        size="sm"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600 flex items-center">
                        Page {page}
                    </span>
                    <Button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        size="sm"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10,
    page = 1,
    perPage = 10
): Promise<SpeciesCountResult[]> {
    const response = await api.get(
        `/iNatAPI/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false&page=${page}&per_page=${perPage}`
    )
    if (!response.data) {
        return []
    }
    return response.data.results as SpeciesCountResult[]
}
