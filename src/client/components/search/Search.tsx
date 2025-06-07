'use client'

import type React from 'react'

import FilterController from '@/components/search/FilterController'
import { ResultsGrid } from '@/components/search/ResultsGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAppContext } from '@/contexts/app-context'
import { Search } from 'lucide-react'
import { useState } from 'react'

export default function SearchInterface() {
    const { query, setQuery, submitQuery, searchType, setSearchType } =
        useAppContext()
    const [localQuery, setLocalQuery] = useState(query)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setQuery(localQuery)
        await submitQuery(localQuery)
    }

    return (
        <div className='space-y-4'>
            {/* Search form */}
            <form onSubmit={handleSubmit} className='flex gap-2'>
                <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className='w-40'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='species'>Species</SelectItem>
                        <SelectItem value='observations'>Observations</SelectItem>
                        <SelectItem value='collections'>Collections</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder={`Search ${searchType}...`}
                    className='flex-1'
                />
                <Button type='submit'>
                    <Search className='h-4 w-4' />
                </Button>
            </form>

            {/* Filter controller */}
            <FilterController />

            {/* Results */}
            <ResultsGrid />
        </div>
    )
}
