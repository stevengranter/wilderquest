'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/contexts/app-context'
import { ChevronDown, Filter, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export default function FilterController() {
    const {
        results,
        searchType,
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        setFilteredResults,
    } = useAppContext()

    const [isOpen, setIsOpen] = useState(false)

    // Extract available filter options from results
    const availableOptions = useMemo(() => {
        if (!results || results.length === 0)
            return { kingdoms: [], ranks: [], locations: [] }

        const kingdoms = new Set<string>()
        const ranks = new Set<string>()
        const locations = new Set<string>()

        results.forEach((result) => {
            switch (searchType) {
                case 'species':
                    if (result.iconic_taxon_name) {
                        kingdoms.add(result.iconic_taxon_name)
                    }
                    if (result.rank) {
                        ranks.add(result.rank)
                    }
                    break
                case 'observations':
                    if (result.place_guess) {
                        locations.add(result.place_guess)
                    }
                    break
                case 'collections':
                    break
            }
        })

        return {
            kingdoms: Array.from(kingdoms).sort(),
            ranks: Array.from(ranks).sort(),
            locations: Array.from(locations).sort().slice(0, 10),
        }
    }, [results, searchType])

    // Apply filters to results
    const filteredResults = useMemo(() => {
        if (!results) return []

        return results.filter((result) => {
            switch (searchType) {
                case 'species':
                    if (filters.kingdoms.size > 0 && result.iconic_taxon_name) {
                        if (!filters.kingdoms.has(result.iconic_taxon_name)) {
                            return false
                        }
                    }

                    if (filters.ranks.size > 0 && result.rank) {
                        if (!filters.ranks.has(result.rank)) {
                            return false
                        }
                    }
                    break

                case 'observations':
                    if (filters.hasPhotos !== null) {
                        const hasPhotos = result.photos && result.photos.length > 0
                        if (filters.hasPhotos !== hasPhotos) {
                            return false
                        }
                    }

                    if (filters.dateRange.start && result.observed_on) {
                        if (
                            new Date(result.observed_on) < new Date(filters.dateRange.start)
                        ) {
                            return false
                        }
                    }
                    if (filters.dateRange.end && result.observed_on) {
                        if (
                            new Date(result.observed_on) > new Date(filters.dateRange.end)
                        ) {
                            return false
                        }
                    }

                    if (filters.location && result.place_guess) {
                        if (
                            !result.place_guess
                                .toLowerCase()
                                .includes(filters.location.toLowerCase())
                        ) {
                            return false
                        }
                    }
                    break

                case 'collections':
                    break
            }

            return true
        })
    }, [results, filters, searchType])

    // Update filtered results when filters change
    useEffect(() => {
        setFilteredResults(filteredResults)
    }, [filteredResults, setFilteredResults])

    const handleKingdomToggle = (kingdom: string) => {
        const newKingdoms = new Set(filters.kingdoms)
        if (newKingdoms.has(kingdom)) {
            newKingdoms.delete(kingdom)
        } else {
            newKingdoms.add(kingdom)
        }
        updateFilter('kingdoms', newKingdoms)
    }

    const handleRankToggle = (rank: string) => {
        const newRanks = new Set(filters.ranks)
        if (newRanks.has(rank)) {
            newRanks.delete(rank)
        } else {
            newRanks.add(rank)
        }
        updateFilter('ranks', newRanks)
    }

    const activeFilterCount =
        filters.kingdoms.size +
        filters.ranks.size +
        (filters.hasPhotos !== null ? 1 : 0) +
        (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
        (filters.location ? 1 : 0)

    const getKingdomIcon = (kingdom: string) => {
        const icons: Record<string, string> = {
            Plantae: '🌱',
            Animalia: '🐾',
            Fungi: '🍄',
            Chromista: '🦠',
            Protozoa: '🔬',
            Bacteria: '🦠',
            Archaea: '🦠',
        }
        return icons[kingdom] || '🔬'
    }

    if (!results || results.length === 0) return null

    return (
        <div className='flex items-center gap-2'>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant='outline' size='sm' className='gap-2'>
                        <Filter className='h-4 w-4' />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge
                                variant='secondary'
                                className='ml-1 h-5 w-5 rounded-full p-0 text-xs'
                            >
                                {activeFilterCount}
                            </Badge>
                        )}
                        <ChevronDown className='h-4 w-4' />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80' align='start'>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <h4 className='font-medium'>Filter Results</h4>
                            {activeFilterCount > 0 && (
                                <Button variant='ghost' size='sm' onClick={clearFilters}>
                                    Clear All
                                </Button>
                            )}
                        </div>

                        {searchType === 'species' && (
                            <>
                                {availableOptions.kingdoms.length > 0 && (
                                    <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>Kingdom</Label>
                                        <div className='grid grid-cols-1 gap-2'>
                                            {availableOptions.kingdoms.map((kingdom) => (
                                                <div
                                                    key={kingdom}
                                                    className='flex items-center space-x-2'
                                                >
                                                    <Checkbox
                                                        id={`kingdom-${kingdom}`}
                                                        checked={filters.kingdoms.has(kingdom)}
                                                        onCheckedChange={() => handleKingdomToggle(kingdom)}
                                                    />
                                                    <Label
                                                        htmlFor={`kingdom-${kingdom}`}
                                                        className='text-sm flex items-center gap-2 cursor-pointer'
                                                    >
                                                        <span>{getKingdomIcon(kingdom)}</span>
                                                        {kingdom}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {availableOptions.ranks.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className='space-y-2'>
                                            <Label className='text-sm font-medium'>
                                                Taxonomic Rank
                                            </Label>
                                            <div className='grid grid-cols-2 gap-2'>
                                                {availableOptions.ranks.map((rank) => (
                                                    <div
                                                        key={rank}
                                                        className='flex items-center space-x-2'
                                                    >
                                                        <Checkbox
                                                            id={`rank-${rank}`}
                                                            checked={filters.ranks.has(rank)}
                                                            onCheckedChange={() => handleRankToggle(rank)}
                                                        />
                                                        <Label
                                                            htmlFor={`rank-${rank}`}
                                                            className='text-sm capitalize cursor-pointer'
                                                        >
                                                            {rank}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {searchType === 'observations' && (
                            <>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Photos</Label>
                                    <div className='space-y-2'>
                                        <div className='flex items-center space-x-2'>
                                            <Checkbox
                                                id='has-photos'
                                                checked={filters.hasPhotos === true}
                                                onCheckedChange={(checked) =>
                                                    updateFilter('hasPhotos', checked ? true : null)
                                                }
                                            />
                                            <Label
                                                htmlFor='has-photos'
                                                className='text-sm cursor-pointer'
                                            >
                                                Has photos
                                            </Label>
                                        </div>
                                        <div className='flex items-center space-x-2'>
                                            <Checkbox
                                                id='no-photos'
                                                checked={filters.hasPhotos === false}
                                                onCheckedChange={(checked) =>
                                                    updateFilter('hasPhotos', checked ? false : null)
                                                }
                                            />
                                            <Label
                                                htmlFor='no-photos'
                                                className='text-sm cursor-pointer'
                                            >
                                                No photos
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Date Range</Label>
                                    <div className='grid grid-cols-2 gap-2'>
                                        <div>
                                            <Label
                                                htmlFor='start-date'
                                                className='text-xs text-muted-foreground'
                                            >
                                                From
                                            </Label>
                                            <input
                                                id='start-date'
                                                type='date'
                                                value={filters.dateRange.start}
                                                onChange={(e) =>
                                                    updateFilter('dateRange', {
                                                        ...filters.dateRange,
                                                        start: e.target.value,
                                                    })
                                                }
                                                className='w-full px-2 py-1 text-sm border rounded'
                                            />
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor='end-date'
                                                className='text-xs text-muted-foreground'
                                            >
                                                To
                                            </Label>
                                            <input
                                                id='end-date'
                                                type='date'
                                                value={filters.dateRange.end}
                                                onChange={(e) =>
                                                    updateFilter('dateRange', {
                                                        ...filters.dateRange,
                                                        end: e.target.value,
                                                    })
                                                }
                                                className='w-full px-2 py-1 text-sm border rounded'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='location-filter'
                                        className='text-sm font-medium'
                                    >
                                        Location
                                    </Label>
                                    <input
                                        id='location-filter'
                                        type='text'
                                        placeholder='Filter by location...'
                                        value={filters.location}
                                        onChange={(e) => updateFilter('location', e.target.value)}
                                        className='w-full px-2 py-1 text-sm border rounded'
                                    />
                                </div>
                            </>
                        )}

                        <div className='pt-2 text-xs text-muted-foreground'>
                            Showing {filteredResults.length} of {results.length} results
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {activeFilterCount > 0 && (
                <div className='flex flex-wrap gap-1'>
                    {Array.from(filters.kingdoms).map((kingdom) => (
                        <Badge key={kingdom} variant='secondary' className='gap-1'>
                            {getKingdomIcon(kingdom)} {kingdom}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='h-auto p-0 ml-1'
                                onClick={() => handleKingdomToggle(kingdom)}
                            >
                                <X className='h-3 w-3' />
                            </Button>
                        </Badge>
                    ))}
                    {Array.from(filters.ranks).map((rank) => (
                        <Badge key={rank} variant='secondary' className='gap-1'>
                            {rank}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='h-auto p-0 ml-1'
                                onClick={() => handleRankToggle(rank)}
                            >
                                <X className='h-3 w-3' />
                            </Button>
                        </Badge>
                    ))}
                    {filters.hasPhotos !== null && (
                        <Badge variant='secondary' className='gap-1'>
                            {filters.hasPhotos ? 'Has photos' : 'No photos'}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='h-auto p-0 ml-1'
                                onClick={() => updateFilter('hasPhotos', null)}
                            >
                                <X className='h-3 w-3' />
                            </Button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}
