'use client'

import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/app-context'
import { Grid, List, Map } from 'lucide-react'
import { CollectionCard } from '../cards/CollectionCard'
import { ObservationCard } from '../cards/ObservationCard'
import { SpeciesCard } from '../cards/SpeciesCard'

export function ResultsGrid() {
    const {
        filteredResults,
        searchType,
        viewMode,
        setViewMode,
        selectedIds,
        clearSelection,
    } = useAppContext()

    if (!filteredResults || filteredResults.length === 0) {
        return (
            <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <div className='text-center'>
                    <p className='text-lg'>No results found</p>
                    <p className='text-sm'>Try adjusting your search or filters</p>
                </div>
            </div>
        )
    }

    const renderCard = (item: any, index: number) => {
        const key = `${searchType}-${item.id}-${index}`

        switch (searchType) {
            case 'species':
                return <SpeciesCard key={key} species={item} />
            case 'observations':
                return <ObservationCard key={key} observation={item} />
            case 'collections':
                return <CollectionCard key={key} collection={item} />
            default:
                return <SpeciesCard key={key} species={item} />
        }
    }

    return (
        <div className='space-y-4'>
            {/* Header with view controls and selection info */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <h2 className='text-lg font-semibold'>
                        {filteredResults.length} {searchType} found
                    </h2>
                    {selectedIds.size > 0 && (
                        <div className='flex items-center gap-2'>
							<span className='text-sm text-muted-foreground'>
								{selectedIds.size} selected
							</span>
                            <Button variant='outline' size='sm' onClick={clearSelection}>
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </div>

                {/* View mode controls */}
                <div className='flex items-center gap-1 rounded-md p-1'>
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid className='h-4 w-4' />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('list')}
                    >
                        <List className='h-4 w-4' />
                    </Button>
                    <Button
                        variant={viewMode === 'map' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setViewMode('map')}
                    >
                        <Map className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            {/* Results grid */}
            <div
                className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-2'
                }
            >
                {filteredResults.map(renderCard)}
            </div>
        </div>
    )
}
