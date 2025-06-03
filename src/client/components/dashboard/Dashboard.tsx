'use client'

import type React from 'react'

import { useAppContext } from '@/contexts/app-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import SearchForm from '@/components/SearchForm'

export default function Dashboard() {
    const { cards, selectedCard, setSelectedCard, isLoading, filters, setFilters, filteredCards } = useAppContext()

    const categories = [...new Set(cards.map((card) => card.category))]

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            searchTerm: e.target.value || null,
        })
    }

    const handleCategoryChange = (value: string) => {
        setFilters({
            ...filters,
            category: value === 'all' ? null : value,
        })
    }


    return (
        <div className='space-y-6'>
            <SearchForm />
            <div className='flex flex-col md:flex-row gap-4'>
                <Input
                    placeholder='Search cards...'
                    className='md:w-1/2'
                    value={filters.searchTerm || ''}
                    onChange={handleSearch}
                />
                <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
                    <SelectTrigger className='md:w-1/3'>
                        <SelectValue placeholder='Filter by category' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-64'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {filteredCards.length > 0 ? (
                        filteredCards.map((card) => (
                            <Card
                                key={card.id}
                                className={`cursor-pointer transition-all ${selectedCard?.id === card.id ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setSelectedCard(card.id === selectedCard?.id ? null : card)}
                            >
                                <CardHeader>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardDescription>{card.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Badge>{card.category}</Badge>
                                </CardContent>
                                <CardFooter className='text-sm text-muted-foreground'>
                                    Created: {new Date(card.createdAt).toLocaleDateString()}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className='col-span-full text-center py-10'>
                            <p className='text-muted-foreground'>No cards found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}

            {selectedCard && (
                <div className='mt-6 p-4 border rounded-lg'>
                    <h3 className='text-xl font-bold mb-2'>{selectedCard.title}</h3>
                    <p className='mb-4'>{selectedCard.description}</p>
                    <div className='flex justify-between items-center'>
                        <Badge>{selectedCard.category}</Badge>
                        <span className='text-sm text-muted-foreground'>
              Created: {new Date(selectedCard.createdAt).toLocaleDateString()}
            </span>
                    </div>
                </div>
            )}
        </div>
    )
}
