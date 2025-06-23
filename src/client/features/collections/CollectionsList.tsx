import axios from 'axios'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/api/api'
import { Card, CardContent } from '@/components/ui/card'

interface Collection {
    id: string
    name: string
    description?: string
    is_private: boolean
    user_id: string
}

interface CollectionsListProps {
    propUserId?: string // If passed, shows collections of this user
}

const API_BASE_URL = '/api/collections'

export default function CollectionsList({ propUserId }: CollectionsListProps) {
    const { user, token } = useAuth()
    const authenticatedUserId = user?.id

    const viewingOwnCollections = !propUserId || propUserId === authenticatedUserId
    const [collectionsListData, setCollectionsListData] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCollections = async () => {
            setIsLoading(true)
            setIsError(null)

            try {
                let response

                if (viewingOwnCollections && token) {
                    // Authenticated user's private/public collections
                    response = await api.get<Collection[]>(`/collections/mine`)
                    console.log(response.data)
                } else if (propUserId) {
                    // Public collections for another user
                    response = await api.get<Collection[]>(`$/collections/public/${propUserId}`)
                } else {
                    throw new Error('User ID is required to view public collections.')
                }

                setCollectionsListData(response.data)
            } catch (err: any) {
                if (axios.isAxiosError(err)) {
                    const message = err.response?.data?.message || err.message || 'Failed to fetch collections.'
                    setIsError(message)
                } else {
                    setIsError('An unexpected error occurred.')
                }
                setCollectionsListData([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchCollections()
    }, [propUserId, authenticatedUserId, token])

    if (isLoading) return <div>Loading collections...</div>
    if (isError) return <div style={{ color: 'red' }}>Error: {isError}</div>
    if (collectionsListData.length === 0) return <div>No collections to show.</div>

    return (
        <div>
            {/*<h2>{viewingOwnCollections ? 'Your Collections' : 'Public Collections'}</h2>*/}
            <div className='flex'>
                {collectionsListData.map((collection) => (
                    <Card key={collection.id}>
                        <CardContent>
                        <strong>{collection.name}</strong> (ID: {collection.id})
                        {collection.is_private ? ' (Private)' : ' (Public)'}
                        <p>{collection.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
