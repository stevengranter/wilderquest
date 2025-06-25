import axios from 'axios'
import { isError } from 'lodash'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '@/api/api'
import { Card, CardContent } from '@/components/ui/card'
import Droppable from '@/components/ui/droppable'
import { useCollections } from '@/features/collections/useCollections'
import { useAuth } from '@/hooks/useAuth'
import { Collection } from './collection.types'

interface CollectionsListProps {
    collections?: Collection[]
    isError?: string | null
    isLoading?: boolean | null
    propUserId?: string // If passed, shows collections of this user
}

export default function CollectionsList({
    propUserId,
    collections,
    isError,
    isLoading,
}: CollectionsListProps) {
    if (isLoading) return <div>Loading collections...</div>
    if (isError) return <div style={{ color: 'red' }}>Error: {isError}</div>
    if (collections?.length === 0) return <div>No collections to show.</div>

    return (
        <div>
            <div className="flex">
                {collections?.map((collection) => (
                    <Droppable
                        uniqueId={`collection-${collection.id}`}
                        onOverClassName="border-2 border-pink-500"
                        key={collection.id}
                    >
                        <Link to={`/collections/${collection.id}`}>
                            <Card>
                                <CardContent>
                                    <strong>{collection.name}</strong> (ID:{' '}
                                    {collection.id})
                                    {collection.is_private
                                        ? ' (Private)'
                                        : ' (Public)'}
                                    <p>{collection.description}</p>
                                    <p>
                                        Total taxa:
                                        {collection?.taxon_ids?.length}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </Droppable>
                ))}
            </div>
        </div>
    )
}
