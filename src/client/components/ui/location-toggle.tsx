'use client'

import { cn } from '@/lib/utils'
import { Globe, MapPin, X } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

interface LocationToggleProps {
    value?: 'worldwide' | 'custom';
    customLocation?: string;
    onValueChange?: (
        value: 'worldwide' | 'custom',
        customLocation?: string,
    ) => void;
    placeholder?: string;
    className?: string;
}

export function LocationToggle({
                                   value = 'worldwide',
                                   customLocation = '',
                                   onValueChange,
                                   placeholder = 'Enter location...',
                                   className,
                               }: LocationToggleProps) {
    const [selectedMode, setSelectedMode] = useState<'worldwide' | 'custom'>(
        value,
    )
    const [location, setLocation] = useState(customLocation)
    const [isEditing, setIsEditing] = useState(false)

    const handleModeChange = (newValue: string) => {
        if (newValue === 'worldwide' || newValue === 'custom') {
            setSelectedMode(newValue)
            if (newValue === 'worldwide') {
                setIsEditing(false)
            } else if (newValue === 'custom' && !location) {
                setIsEditing(true)
            }
            onValueChange?.(newValue, newValue === 'custom' ? location : undefined)
        }
    }

    const handleLocationSubmit = () => {
        if (location.trim()) {
            setIsEditing(false)
            onValueChange?.(selectedMode, location.trim())
        }
    }

    const handleLocationKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleLocationSubmit()
        }
    }

    const handleLocationBlur = () => {
        if (location.trim()) {
            handleLocationSubmit()
        }
    }

    const handleLocationClear = () => {
        setLocation('')
        setIsEditing(true)
    }

    return (
        <div className={cn('space-y-2', className)}>
            <ToggleGroup
                type='single'
                value={selectedMode}
                onValueChange={handleModeChange}
            >
                <ToggleGroupItem value='worldwide' icon={<Globe size={16} />}>
                    Worldwide
                </ToggleGroupItem>
                <ToggleGroupItem value='custom' icon={<MapPin size={16} />}>
                    {selectedMode === 'custom' && location && !isEditing
                        ? location
                        : 'Custom'}
                </ToggleGroupItem>
            </ToggleGroup>

            {selectedMode === 'custom' && (isEditing || !location) && (
                <div className='flex gap-1'>
                    <input
                        type='text'
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleLocationKeyDown}
                        onBlur={handleLocationBlur}
                        placeholder={placeholder}
                        className='flex-1 rounded-base border-2 border-border bg-white px-2 py-1 text-xs font-bold text-main-foreground focus:outline-none'
                        autoFocus
                    />
                    <button
                        type='button'
                        onClick={handleLocationSubmit}
                        disabled={!location.trim()}
                        className='rounded-base border-2 border-border bg-main px-2 py-1 text-xs font-bold text-white hover:bg-main/90 focus:outline-none disabled:bg-gray-300 disabled:text-gray-500'
                    >
                        Set
                    </button>
                </div>
            )}

            {selectedMode === 'custom' && location && !isEditing && (
                <div className='flex items-center gap-1 text-xs'>
                    <span className='text-gray-600'>Location:</span>
                    <span className='font-bold'>{location}</span>
                    <button
                        type='button'
                        onClick={handleLocationClear}
                        className='ml-1 rounded-base border border-border bg-white p-0.5 hover:bg-main/10 focus:outline-none'
                    >
                        <X size={12} />
                    </button>
                </div>
            )}
        </div>
    )
}
