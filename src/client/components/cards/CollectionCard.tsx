'use client'

import type React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useAppContext } from '@/contexts/app-context'
import { cn } from '@/lib/utils'
import { Folder } from 'lucide-react'

interface CollectionCardProps {
    collection: any
    className?: string
}

export function CollectionCard({ collection, className }: CollectionCardProps) {
    const { selectedIds, addToSelection, removeFromSelection } = useAppContext()

    const isSelected = selectedIds.has(collection.id.toString())

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const id = collection.id.toString()

        if (isSelected) {
            removeFromSelection([id])
        } else {
            addToSelection([id])
        }
    }

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                className,
            )}
            onClick={handleClick}
        >
            <CardContent className='p-4'>
                <div className='space-y-2'>
                    {/* Collections icon and title */}
                    <div className='flex items-center gap-2'>
                        <Folder className='h-5 w-5 text-muted-foreground' />
                        <div className='font-semibold text-lg'>{collection.title}</div>
                    </div>

                    {/* Slug */}
                    {collection.slug && <div className='text-sm text-muted-foreground'>{collection.slug}</div>}

                    {/* Selection indicator */}
                    {isSelected && <div className='text-xs text-blue-600 font-medium'>✓ Selected</div>}
                </div>
            </CardContent>
        </Card>
    )
}
