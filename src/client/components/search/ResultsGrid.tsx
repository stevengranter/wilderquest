'use client'

import MapView from '@/components/search/MapView'
import {
    type INatObservation,
    type INatObservationsResponse,
    type INatTaxaResponse,
    type INatTaxon,
} from '../../../shared/types/iNatTypes'
import { CollectionCard } from '../cards/CollectionCard'
import { ObservationCard } from '../cards/ObservationCard'
import { SpeciesCard } from '../cards/SpeciesCard'

export function ResultsGrid({
    searchCategory,
    viewMode,
    data,
}: {
    searchCategory: string
    viewMode: string
    data: INatTaxaResponse | INatObservationsResponse
}) {
    // const {
    //     filteredResults,
    //     searchCategory,
    //     viewMode,
    //     setViewMode,
    //     selectedIds,
    //     clearSelection,
    // } = useAppContext()

    if (!data?.results || data?.results.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg">No results found</p>
                    <p className="text-sm">
                        Try adjusting your search or filters
                    </p>
                </div>
            </div>
        )
    }

    const renderCard = (item: INatTaxon | INatObservation, index: number) => {
        const key = `${searchCategory}-${item.id}-${index}`

        switch (searchCategory) {
            case 'species':
                return (
                    <SpeciesCard key={key} species={item} viewMode={viewMode} />
                )
            case 'observations':
                return (
                    <ObservationCard
                        key={key}
                        observation={item}
                        viewMode={viewMode}
                    />
                )
            case 'collections':
                return <CollectionCard key={key} collection={item} />
            default:
                return <SpeciesCard key={key} species={item} />
        }
    }

    return (
        <div className="space-y-4">
            {/* Header with view controls and selection info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">
                        {data.results.length} {searchCategory} found
                    </h2>
                    {/*{selectedIds.size > 0 && (*/}
                    {/*    <div className='flex items-center gap-2'>*/}
                    {/*		<span className='text-sm text-muted-foreground'>*/}
                    {/*			{selectedIds.size} selected*/}
                    {/*		</span>*/}
                    {/*        <Button variant='outline' size='sm' onClick={clearSelection}>*/}
                    {/*            Clear Selection*/}
                    {/*        </Button>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </div>

            {/* Results list/grid */}
            {viewMode === 'list' || viewMode === 'grid' ? (
                <div
                    className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6'
                            : 'space-y-2'
                    }
                >
                    {data.results.map(renderCard)}
                </div>
            ) : (
                <MapView />
            )}
        </div>
    )
}
